// app/api/payment/verify/route.ts
import { getCurrentUser } from '@/lib/auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Subscription } from '@/lib/db/models/Subscription';

// Lazy Stripe initialization — safe when STRIPE_SECRET_KEY is not configured (INR users)
function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.startsWith('sk_test_your') || key.length < 20) {
        return null;
    }
    return new Stripe(key, { apiVersion: '2024-06-20' });
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Credit mappings
const PLAN_CREDITS: Record<string, number> = {
    pro_monthly: 100,
    pro_yearly: 100,
    team_monthly: 500,
    team_yearly: 500,
};

export async function POST(req: NextRequest) {
    let isRedirect = req.nextUrl.searchParams.get('redirect') === 'true';
    try {
        let body: any = {};
        const contentType = req.headers.get('content-type') || '';
        
        if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData();
            formData.forEach((value, key) => {
                body[key] = value;
            });
        } else {
            try {
                body = await req.json();
            } catch (err) {
                body = {};
            }
        }

        const {
            paymentMethod: reqPaymentMethod,
            sessionId,
            razorpayPaymentId: camelPaymentId,
            razorpayOrderId: camelOrderId,
            razorpaySubscriptionId: camelSubscriptionId,
            razorpaySignature: camelSignature,
            razorpay_payment_id: snakePaymentId,
            razorpay_order_id: snakeOrderId,
            razorpay_subscription_id: snakeSubscriptionId,
            razorpay_signature: snakeSignature,
        } = body;

        const paymentMethod = reqPaymentMethod || req.nextUrl.searchParams.get('paymentMethod') || 'stripe';
        if (req.nextUrl.searchParams.get('redirect') === 'true') {
            isRedirect = true;
        }

        const finalPaymentId = camelPaymentId || snakePaymentId;
        const finalOrderId = camelOrderId || snakeOrderId;
        const finalSubscriptionId = camelSubscriptionId || snakeSubscriptionId;
        const finalSignature = camelSignature || snakeSignature;

        await connectToDatabase();

        if (paymentMethod === 'stripe') {
            const authUser = await getCurrentUser();
            const userId = authUser?.id;

            if (!userId) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
            return verifyStripePayment(userId, sessionId);
        } else if (paymentMethod === 'razorpay') {
            const authUser = await getCurrentUser();
            const userId = authUser?.id;

            return verifyRazorpayPayment(
                userId || null,
                finalPaymentId,
                finalOrderId,
                finalSubscriptionId,
                finalSignature,
                isRedirect
            );
        } else {
            if (isRedirect) {
                return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/billing?payment=failed&error=invalid_method`);
            }
            return NextResponse.json(
                { error: 'Invalid payment method' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        if (isRedirect) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/billing?payment=failed`);
        }
        return NextResponse.json(
            { error: 'Failed to verify payment' },
            { status: 500 }
        );
    }
}

async function verifyStripePayment(userId: string, sessionId: string) {
    const stripe = getStripe();
    if (!stripe) {
        return NextResponse.json(
            { error: 'Stripe is not configured on this server. Use INR/Razorpay payments.' },
            { status: 503 }
        );
    }

    if (!sessionId) {
        return NextResponse.json(
            { error: 'Session ID is required' },
            { status: 400 }
        );
    }

    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'payment_intent'],
    });

    if (session.payment_status !== 'paid') {
        return NextResponse.json(
            { error: 'Payment not completed', status: session.payment_status },
            { status: 400 }
        );
    }

    // Verify the session belongs to this user
    if (session.metadata?.clerkId !== userId) {
        return NextResponse.json(
            { error: 'Session does not belong to user' },
            { status: 403 }
        );
    }

    // Note: clerkId field holds MongoDB _id value via pre-save hook.
    // userId here is the JWT payload id (= MongoDB _id string).
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
        return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
        );
    }

    if (session.mode === 'subscription') {
        const subscription = session.subscription as Stripe.Subscription;
        const plan = session.metadata?.plan || 'pro';
        const credits = PLAN_CREDITS[plan] || 100;

        // Update user subscription
        await User.findOneAndUpdate(
            { clerkId: userId },
            {
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscription.id,
                'subscription.plan': plan.includes('team') ? 'team' : 'pro',
                'subscription.status': 'active',
                'subscription.credits': credits,
                'subscription.creditsUsed': 0,
                'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
                'subscription.paymentMethod': 'stripe',
                credits: credits, // Sync legacy root field
                updatedAt: new Date(),
            }
        );

        return NextResponse.json({
            success: true,
            type: 'subscription',
            plan: plan.includes('team') ? 'team' : 'pro',
            credits,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });
    } else {
        // One-time payment for credits
        const credits = parseInt(session.metadata?.credits || '0');

        await User.findOneAndUpdate(
            { clerkId: userId },
            {
                $inc: { 
                    'subscription.credits': credits,
                    'credits': credits // Sync legacy root field
                },
                $push: {
                    paymentHistory: {
                        sessionId,
                        amount: session.amount_total! / 100,
                        currency: session.currency,
                        type: 'credit_purchase',
                        credits,
                        status: 'completed',
                        createdAt: new Date(),
                    },
                },
                updatedAt: new Date(),
            }
        );

        // Note: clerkId field holds MongoDB _id value via pre-save hook.
        // userId here is the JWT payload id (= MongoDB _id string).
        const updatedUser = await User.findOne({ clerkId: userId });

        return NextResponse.json({
            success: true,
            type: 'credits',
            creditsAdded: credits,
            totalCredits: updatedUser?.subscription.credits || credits,
        });
    }
}

async function verifyRazorpayPayment(
    userId: string | null,
    paymentId: string,
    orderId?: string,
    subscriptionId?: string,
    signature?: string,
    isRedirect?: boolean
) {
    if (!paymentId) {
        if (isRedirect) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/billing?payment=failed&error=missing_payment_id`);
        }
        return NextResponse.json(
            { error: 'Payment ID is required' },
            { status: 400 }
        );
    }

    if (!signature) {
        if (isRedirect) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/billing?payment=failed&error=missing_signature`);
        }
        return NextResponse.json(
            { error: 'Signature is required' },
            { status: 400 }
        );
    }

    // Verify signature
    let expectedSignature: string;

    if (subscriptionId) {
        // Subscription payment
        expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${paymentId}|${subscriptionId}`)
            .digest('hex');
    } else if (orderId) {
        // One-time payment
        expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');
    } else {
        if (isRedirect) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/billing?payment=failed&error=missing_ids`);
        }
        return NextResponse.json(
            { error: 'Order ID or Subscription ID is required' },
            { status: 400 }
        );
    }

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    const isSignatureValid = sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!isSignatureValid) {
        if (isRedirect) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/billing?payment=failed&error=invalid_signature`);
        }
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        );
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(paymentId);

    if (payment.status !== 'captured') {
        if (isRedirect) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/billing?payment=failed&error=not_captured`);
        }
        return NextResponse.json(
            { error: 'Payment not captured', status: payment.status },
            { status: 400 }
        );
    }

    // Verify payment belongs to user (find clerkId from metadata)
    let metadataUserId = (payment.notes as any)?.clerkId;
    if (subscriptionId && !metadataUserId) {
        const subscription = await razorpay.subscriptions.fetch(subscriptionId);
        metadataUserId = (subscription.notes as any)?.clerkId;
    }

    const finalUserId = userId || metadataUserId;
    if (!finalUserId) {
        if (isRedirect) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/billing?payment=failed&error=user_not_identified`);
        }
        return NextResponse.json(
            { error: 'User could not be identified' },
            { status: 400 }
        );
    }

    if (userId && metadataUserId && userId !== metadataUserId) {
        if (isRedirect) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/billing?payment=failed&error=user_mismatch`);
        }
        return NextResponse.json(
            { error: 'User mismatch' },
            { status: 403 }
        );
    }

    // Note: clerkId field holds MongoDB _id value via pre-save hook.
    // userId here is the JWT payload id (= MongoDB _id string).
    const user = await User.findOne({ clerkId: finalUserId });

    if (!user) {
        if (isRedirect) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/billing?payment=failed&error=user_not_found`);
        }
        return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
        );
    }

    if (subscriptionId) {
        // Subscription payment
        const subscription = await razorpay.subscriptions.fetch(subscriptionId);
        const plan = (subscription.notes as any)?.plan || 'pro_monthly';
        const credits = PLAN_CREDITS[plan] || 100;
        const currentPeriodStart = (subscription as any).current_start ? new Date((subscription as any).current_start * 1000) : new Date();
        const currentPeriodEnd = (subscription as any).current_end ? new Date((subscription as any).current_end * 1000) : new Date(Date.now() + 30 * 86400000);

        await User.findOneAndUpdate(
            { clerkId: finalUserId },
            {
                razorpayCustomerId: (payment as any).customer_id || (subscription as any).customer_id,
                razorpaySubscriptionId: subscriptionId,
                'subscription.plan': plan.includes('team') ? 'team' : 'pro',
                'subscription.status': 'active',
                'subscription.credits': credits,
                'subscription.creditsUsed': 0,
                'subscription.currentPeriodStart': currentPeriodStart,
                'subscription.currentPeriodEnd': currentPeriodEnd,
                'subscription.paymentMethod': 'razorpay',
                credits: credits, // Sync legacy root field
                updatedAt: new Date(),
            }
        );

        // Create subscription record
        await Subscription.findOneAndUpdate(
            { clerkId: finalUserId },
            {
                clerkId: finalUserId,
                razorpayCustomerId: (payment as any).customer_id || (subscription as any).customer_id,
                razorpaySubscriptionId: subscriptionId,
                plan: plan.includes('team') ? 'team' : 'pro',
                status: 'active',
                paymentMethod: 'razorpay',
                currentPeriodStart,
                currentPeriodEnd,
                updatedAt: new Date(),
            },
            { upsert: true, new: true }
        );

        if (isRedirect) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard?upgrade=success`);
        }

        return NextResponse.json({
            success: true,
            type: 'subscription',
            plan: plan.includes('team') ? 'team' : 'pro',
            credits,
            currentPeriodEnd,
        });
    } else {
        // One-time payment for credits
        const credits = parseInt((payment.notes as any)?.credits || '0');

        // ── Idempotency check (PAY-03) ───────────────────────────────────────
        const alreadyProcessed = await User.findOne({
            _id: user._id,
            'paymentHistory.paymentId': paymentId,
        });
        if (alreadyProcessed) {
            if (isRedirect) {
                return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard?upgrade=success`);
            }
            return NextResponse.json({ success: true, message: 'Payment already processed' }, { status: 200 });
        }

        await User.findOneAndUpdate(
            { clerkId: finalUserId },
            {
                $inc: { 
                    'subscription.credits': credits,
                    'credits': credits // Sync legacy root field
                },
                $push: {
                    paymentHistory: {
                        paymentId,
                        orderId,
                        amount: Number(payment.amount || 0) / 100,
                        currency: payment.currency,
                        type: 'credit_purchase',
                        credits,
                        status: 'completed',
                        createdAt: new Date(),
                    },
                },
                updatedAt: new Date(),
            }
        );

        // Note: clerkId field holds MongoDB _id value via pre-save hook.
        // userId here is the JWT payload id (= MongoDB _id string).
        const updatedUser = await User.findOne({ clerkId: finalUserId });

        if (isRedirect) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard?upgrade=success`);
        }

        return NextResponse.json({
            success: true,
            type: 'credits',
            creditsAdded: credits,
            totalCredits: updatedUser?.subscription.credits || credits,
        });
    }
}

// Get payment status
export async function GET(req: NextRequest) {
    try {
        const authUser = await getCurrentUser();
  const userId = authUser?.id;

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        const stripe = getStripe();
        if (!stripe) {
            return NextResponse.json(
                { error: 'Stripe is not configured on this server. Use INR/Razorpay payments.' },
                { status: 503 }
            );
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        return NextResponse.json({
            status: session.payment_status,
            mode: session.mode,
            customerId: session.customer,
        });
    } catch (error) {
        console.error('Error getting payment status:', error);
        return NextResponse.json(
            { error: 'Failed to get payment status' },
            { status: 500 }
        );
    }
}