// app/api/payment/credits/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
});

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Credit packages
const CREDIT_PACKAGES = {
    small: { credits: 25, usd: 9.99, inr: 799 },
    medium: { credits: 50, usd: 17.99, inr: 1499 },
    large: { credits: 100, usd: 29.99, inr: 2499 },
    xlarge: { credits: 250, usd: 59.99, inr: 4999 },
    enterprise: { credits: 500, usd: 99.99, inr: 8499 },
};

type PackageType = keyof typeof CREDIT_PACKAGES;

// GET - Get user's current credits
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectToDatabase();

        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const subscription = user.subscription;

        return NextResponse.json({
            credits: subscription.credits,
            creditsUsed: subscription.creditsUsed,
            creditsRemaining: subscription.credits - subscription.creditsUsed,
            plan: subscription.plan,
            resetDate: subscription.resetDate || subscription.currentPeriodEnd,
            packages: CREDIT_PACKAGES,
        });
    } catch (error) {
        console.error('Error getting credits:', error);
        return NextResponse.json(
            { error: 'Failed to get credits' },
            { status: 500 }
        );
    }
}

// POST - Purchase credits
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const {
            package: packageType,
            paymentMethod = 'stripe',
            successUrl,
            cancelUrl,
        } = body as {
            package: PackageType;
            paymentMethod: 'stripe' | 'razorpay';
            successUrl?: string;
            cancelUrl?: string;
        };

        if (!packageType || !CREDIT_PACKAGES[packageType]) {
            return NextResponse.json(
                { error: 'Invalid package' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const pkg = CREDIT_PACKAGES[packageType];
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const finalSuccessUrl = successUrl || `${baseUrl}/dashboard?credits=success`;
        const finalCancelUrl = cancelUrl || `${baseUrl}/pricing?credits=canceled`;

        if (paymentMethod === 'stripe') {
            // Get or create Stripe customer
            let customerId = user.stripeCustomerId;

            if (!customerId) {
                const customer = await stripe.customers.create({
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`.trim() || undefined,
                    metadata: { clerkId: userId },
                });
                customerId = customer.id;

                await User.findOneAndUpdate(
                    { clerkId: userId },
                    { stripeCustomerId: customerId }
                );
            }

            // Create checkout session
            const session = await stripe.checkout.sessions.create({
                customer: customerId,
                payment_method_types: ['card'],
                mode: 'payment',
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: `${pkg.credits} AI Rendering Credits`,
                                description: `Add ${pkg.credits} credits to your Removation.ai account`,
                            },
                            unit_amount: Math.round(pkg.usd * 100),
                        },
                        quantity: 1,
                    },
                ],
                success_url: `${finalSuccessUrl}&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: finalCancelUrl,
                metadata: {
                    clerkId: userId,
                    type: 'credits',
                    package: packageType,
                    credits: String(pkg.credits),
                },
            });

            return NextResponse.json({
                type: 'stripe',
                sessionId: session.id,
                url: session.url,
            });
        } else if (paymentMethod === 'razorpay') {
            // Create Razorpay order
            const order = await razorpay.orders.create({
                amount: pkg.inr * 100, // Convert to paise
                currency: 'INR',
                notes: {
                    clerkId: userId,
                    type: 'credits',
                    package: packageType,
                    credits: String(pkg.credits),
                },
            });

            return NextResponse.json({
                type: 'razorpay',
                orderId: order.id,
                keyId: process.env.RAZORPAY_KEY_ID,
                amount: pkg.inr * 100,
                currency: 'INR',
                name: 'Removation.ai',
                description: `${pkg.credits} AI Rendering Credits`,
                prefill: {
                    name: `${user.firstName} ${user.lastName}`.trim(),
                    email: user.email,
                },
                notes: {
                    clerkId: userId,
                    type: 'credits',
                    package: packageType,
                    credits: String(pkg.credits),
                },
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid payment method' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error purchasing credits:', error);
        return NextResponse.json(
            { error: 'Failed to initiate credit purchase' },
            { status: 500 }
        );
    }
}

// PUT - Use credits (internal API for deducting credits)
export async function PUT(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { amount = 1, operation = 'deduct' } = body as {
            amount?: number;
            operation?: 'deduct' | 'add' | 'refund';
        };

        await connectToDatabase();

        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const subscription = user.subscription;
        const availableCredits = subscription.credits - subscription.creditsUsed;

        if (operation === 'deduct') {
            if (availableCredits < amount) {
                return NextResponse.json(
                    {
                        error: 'Insufficient credits',
                        available: availableCredits,
                        required: amount,
                    },
                    { status: 402 }
                );
            }

            await User.findOneAndUpdate(
                { clerkId: userId },
                {
                    $inc: { 'subscription.creditsUsed': amount },
                    lastRenderAt: new Date(),
                    updatedAt: new Date(),
                }
            );

            return NextResponse.json({
                success: true,
                creditsUsed: amount,
                creditsRemaining: availableCredits - amount,
            });
        } else if (operation === 'add') {
            await User.findOneAndUpdate(
                { clerkId: userId },
                {
                    $inc: { 'subscription.credits': amount },
                    updatedAt: new Date(),
                }
            );

            return NextResponse.json({
                success: true,
                creditsAdded: amount,
                totalCredits: subscription.credits + amount,
            });
        } else if (operation === 'refund') {
            // Refund credits (decrease credits used)
            const newCreditsUsed = Math.max(0, subscription.creditsUsed - amount);

            await User.findOneAndUpdate(
                { clerkId: userId },
                {
                    'subscription.creditsUsed': newCreditsUsed,
                    updatedAt: new Date(),
                }
            );

            return NextResponse.json({
                success: true,
                creditsRefunded: amount,
                creditsRemaining: subscription.credits - newCreditsUsed,
            });
        }

        return NextResponse.json(
            { error: 'Invalid operation' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error managing credits:', error);
        return NextResponse.json(
            { error: 'Failed to manage credits' },
            { status: 500 }
        );
    }
}