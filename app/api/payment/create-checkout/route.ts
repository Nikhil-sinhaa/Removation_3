// app/api/payment/create-checkout/route.ts
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

// Pricing configuration
const PRICING = {
    stripe: {
        pro_monthly: {
            priceId: process.env.STRIPE_PRICE_PRO_MONTHLY!,
            amount: 2900, // $29
            currency: 'usd',
        },
        pro_yearly: {
            priceId: process.env.STRIPE_PRICE_PRO_YEARLY!,
            amount: 29000, // $290 (save ~17%)
            currency: 'usd',
        },
        team_monthly: {
            priceId: process.env.STRIPE_PRICE_TEAM_MONTHLY!,
            amount: 9900, // $99
            currency: 'usd',
        },
        team_yearly: {
            priceId: process.env.STRIPE_PRICE_TEAM_YEARLY!,
            amount: 99000, // $990 (save ~17%)
            currency: 'usd',
        },
        credits_50: {
            amount: 1900, // $19
            credits: 50,
            currency: 'usd',
        },
        credits_100: {
            amount: 3500, // $35
            credits: 100,
            currency: 'usd',
        },
        credits_200: {
            amount: 6000, // $60
            credits: 200,
            currency: 'usd',
        },
    },
    razorpay: {
        pro_monthly: {
            planId: process.env.RAZORPAY_PLAN_PRO_MONTHLY!,
            amount: 239900, // ₹2,399
            currency: 'INR',
        },
        pro_yearly: {
            planId: process.env.RAZORPAY_PLAN_PRO_YEARLY!,
            amount: 2399000, // ₹23,990 (save ~17%)
            currency: 'INR',
        },
        team_monthly: {
            planId: process.env.RAZORPAY_PLAN_TEAM_MONTHLY!,
            amount: 819900, // ₹8,199
            currency: 'INR',
        },
        team_yearly: {
            planId: process.env.RAZORPAY_PLAN_TEAM_YEARLY!,
            amount: 8199000, // ₹81,990 (save ~17%)
            currency: 'INR',
        },
        credits_50: {
            amount: 149900, // ₹1,499
            credits: 50,
            currency: 'INR',
        },
        credits_100: {
            amount: 279900, // ₹2,799
            credits: 100,
            currency: 'INR',
        },
        credits_200: {
            amount: 479900, // ₹4,799
            credits: 200,
            currency: 'INR',
        },
    },
};

type PlanType = 'pro_monthly' | 'pro_yearly' | 'team_monthly' | 'team_yearly' | 'credits_50' | 'credits_100' | 'credits_200';

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
            plan,
            paymentMethod = 'stripe',
            successUrl,
            cancelUrl
        } = body as {
            plan: PlanType;
            paymentMethod: 'stripe' | 'razorpay';
            successUrl?: string;
            cancelUrl?: string;
        };

        if (!plan) {
            return NextResponse.json(
                { error: 'Plan is required' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Get user from database
        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const finalSuccessUrl = successUrl || `${baseUrl}/dashboard?payment=success`;
        const finalCancelUrl = cancelUrl || `${baseUrl}/pricing?payment=canceled`;

        if (paymentMethod === 'stripe') {
            return handleStripeCheckout(user, plan, userId, finalSuccessUrl, finalCancelUrl);
        } else if (paymentMethod === 'razorpay') {
            return handleRazorpayCheckout(user, plan, userId);
        } else {
            return NextResponse.json(
                { error: 'Invalid payment method' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error creating checkout:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}

async function handleStripeCheckout(
    user: any,
    plan: PlanType,
    clerkId: string,
    successUrl: string,
    cancelUrl: string
) {
    const pricing = PRICING.stripe[plan];

    if (!pricing) {
        return NextResponse.json(
            { error: 'Invalid plan' },
            { status: 400 }
        );
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim() || undefined,
            metadata: {
                clerkId,
            },
        });
        customerId = customer.id;

        // Save customer ID
        await User.findOneAndUpdate(
            { clerkId },
            { stripeCustomerId: customerId }
        );
    }

    // Check if this is a subscription or one-time payment
    const isSubscription = plan.includes('monthly') || plan.includes('yearly');

    if (isSubscription) {
        // Create subscription checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price: (pricing as any).priceId,
                    quantity: 1,
                },
            ],
            success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
            metadata: {
                clerkId,
                plan,
            },
            subscription_data: {
                metadata: {
                    clerkId,
                    plan,
                },
            },
            allow_promotion_codes: true,
            billing_address_collection: 'auto',
        });

        return NextResponse.json({
            type: 'stripe',
            sessionId: session.id,
            url: session.url,
        });
    } else {
        // One-time payment for credits
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: pricing.currency,
                        product_data: {
                            name: `${(pricing as any).credits} Credits`,
                            description: 'AI rendering credits for Removation.ai',
                        },
                        unit_amount: pricing.amount,
                    },
                    quantity: 1,
                },
            ],
            success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
            metadata: {
                clerkId,
                type: 'credits',
                credits: String((pricing as any).credits),
            },
        });

        return NextResponse.json({
            type: 'stripe',
            sessionId: session.id,
            url: session.url,
        });
    }
}

async function handleRazorpayCheckout(
    user: any,
    plan: PlanType,
    clerkId: string
) {
    const pricing = PRICING.razorpay[plan];

    if (!pricing) {
        return NextResponse.json(
            { error: 'Invalid plan' },
            { status: 400 }
        );
    }

    const isSubscription = plan.includes('monthly') || plan.includes('yearly');

    if (isSubscription) {
        // Create Razorpay subscription
        const subscription = await razorpay.subscriptions.create({
            plan_id: (pricing as any).planId,
            total_count: plan.includes('yearly') ? 1 : 12, // 1 for yearly, 12 for monthly
            quantity: 1,
            notes: {
                clerkId,
                plan,
                email: user.email,
            },
        });

        return NextResponse.json({
            type: 'razorpay',
            subscriptionId: subscription.id,
            keyId: process.env.RAZORPAY_KEY_ID,
            amount: pricing.amount,
            currency: pricing.currency,
            name: 'Removation.ai',
            description: `${plan.replace('_', ' ').toUpperCase()} Plan`,
            prefill: {
                name: `${user.firstName} ${user.lastName}`.trim(),
                email: user.email,
            },
            notes: {
                clerkId,
                plan,
            },
        });
    } else {
        // Create Razorpay order for one-time payment
        const order = await razorpay.orders.create({
            amount: pricing.amount,
            currency: pricing.currency,
            notes: {
                clerkId,
                type: 'credits',
                credits: String((pricing as any).credits),
            },
        });

        return NextResponse.json({
            type: 'razorpay',
            orderId: order.id,
            keyId: process.env.RAZORPAY_KEY_ID,
            amount: pricing.amount,
            currency: pricing.currency,
            name: 'Removation.ai',
            description: `${(pricing as any).credits} Credits`,
            prefill: {
                name: `${user.firstName} ${user.lastName}`.trim(),
                email: user.email,
            },
            notes: {
                clerkId,
                type: 'credits',
                credits: String((pricing as any).credits),
            },
        });
    }
}

// Get available plans
export async function GET() {
    return NextResponse.json({
        stripe: {
            currency: 'USD',
            plans: {
                pro_monthly: { price: 29, credits: 100, interval: 'month' },
                pro_yearly: { price: 290, credits: 100, interval: 'year', savings: '17%' },
                team_monthly: { price: 99, credits: 500, interval: 'month' },
                team_yearly: { price: 990, credits: 500, interval: 'year', savings: '17%' },
            },
            credits: {
                credits_50: { price: 19, credits: 50 },
                credits_100: { price: 35, credits: 100 },
                credits_200: { price: 60, credits: 200 },
            },
        },
        razorpay: {
            currency: 'INR',
            plans: {
                pro_monthly: { price: 2399, credits: 100, interval: 'month' },
                pro_yearly: { price: 23990, credits: 100, interval: 'year', savings: '17%' },
                team_monthly: { price: 8199, credits: 500, interval: 'month' },
                team_yearly: { price: 81990, credits: 500, interval: 'year', savings: '17%' },
            },
            credits: {
                credits_50: { price: 1499, credits: 50 },
                credits_100: { price: 2799, credits: 100 },
                credits_200: { price: 4799, credits: 200 },
            },
        },
    });
}