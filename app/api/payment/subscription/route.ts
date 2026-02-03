// app/api/payment/subscription/route.ts
// Updated & Fixed Version (December 2025 best practices)

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20', // Use a more recent stable API version
});

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Helper to get current subscription data (shared between GET and others)
async function getCurrentSubscription(userId: string) {
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId }).lean();

    if (!user) {
        throw new Error('User not found');
    }

    let stripeSub = null;
    let razorpaySub = null;

    if (user.stripeSubscriptionId) {
        try {
            stripeSub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        } catch (err) {
            console.error('Stripe fetch error:', err);
        }
    }

    if (user.razorpaySubscriptionId) {
        try {
            razorpaySub = await razorpay.subscriptions.fetch(user.razorpaySubscriptionId);
        } catch (err) {
            console.error('Razorpay fetch error:', err);
        }
    }

    const subscription = user.subscription || {
        plan: 'free',
        status: 'inactive',
        credits: 0,
        creditsUsed: 0,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        paymentMethod: 'none',
    };

    return {
        user,
        subscription,
        stripeSub,
        razorpaySub,
    };
}

// GET - Fetch subscription details
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { subscription, stripeSub, razorpaySub } = await getCurrentSubscription(userId);

        // Sync status if needed (Stripe example)
        if (stripeSub && stripeSub.status !== subscription.status) {
            await User.updateOne(
                { clerkId: userId },
                {
                    'subscription.status': stripeSub.status,
                    'subscription.cancelAtPeriodEnd': stripeSub.cancel_at_period_end,
                    'subscription.currentPeriodEnd': stripeSub.current_period_end
                        ? new Date(stripeSub.current_period_end * 1000)
                        : null,
                }
            );
        }

        return NextResponse.json({
            plan: subscription.plan || 'free',
            status: subscription.status || 'inactive',
            credits: subscription.credits || 0,
            creditsUsed: subscription.creditsUsed || 0,
            creditsRemaining: (subscription.credits || 0) - (subscription.creditsUsed || 0),
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
            paymentMethod: subscription.paymentMethod || 'none',
            stripeSubscriptionId: stripeSub?.id || null,
            razorpaySubscriptionId: razorpaySub?.id || null,
        });
    } catch (error) {
        console.error('GET subscription error:', error);
        return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }
}

// PUT - Upgrade/Downgrade plan (Stripe only example)
export async function PUT(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { newPlan } = body; // e.g. "pro_monthly", "team_yearly"

        if (!newPlan) {
            return NextResponse.json({ error: 'newPlan is required' }, { status: 400 });
        }

        const { user, stripeSub } = await getCurrentSubscription(userId);

        if (!user.stripeSubscriptionId || !stripeSub) {
            return NextResponse.json({ error: 'No active Stripe subscription' }, { status: 400 });
        }

        const priceMap: Record<string, string> = {
            pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
            pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
            team_monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY!,
            team_yearly: process.env.STRIPE_PRICE_TEAM_YEARLY!,
        };

        const newPriceId = priceMap[newPlan];
        if (!newPriceId) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const updatedSub = await stripe.subscriptions.update(user.stripeSubscriptionId, {
            cancel_at_period_end: false,
            proration_behavior: 'create_prorations',
            items: [
                {
                    id: stripeSub.items.data[0].id,
                    price: newPriceId,
                },
            ],
        });

        const isTeam = newPlan.includes('team');
        const newCredits = isTeam ? 500 : 100;

        await User.updateOne(
            { clerkId: userId },
            {
                'subscription.plan': isTeam ? 'team' : 'pro',
                'subscription.credits': Math.max(user.subscription?.credits || 0, newCredits),
                'subscription.currentPeriodEnd': new Date(updatedSub.current_period_end * 1000),
            }
        );

        return NextResponse.json({
            success: true,
            plan: isTeam ? 'team' : 'pro',
            currentPeriodEnd: new Date(updatedSub.current_period_end * 1000),
        });
    } catch (error) {
        console.error('PUT subscription error:', error);
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }
}

// DELETE - Cancel subscription
export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const immediately = searchParams.get('immediately') === 'true';

        const { user, stripeSub, razorpaySub } = await getCurrentSubscription(userId);

        let canceled = false;

        // Handle Stripe
        if (user.stripeSubscriptionId && stripeSub) {
            if (immediately) {
                await stripe.subscriptions.cancel(user.stripeSubscriptionId);
            } else {
                await stripe.subscriptions.update(user.stripeSubscriptionId, {
                    cancel_at_period_end: true,
                });
            }

            await User.updateOne(
                { clerkId: userId },
                {
                    'subscription.status': immediately ? 'canceled' : 'active',
                    'subscription.plan': immediately ? 'free' : user.subscription?.plan,
                    'subscription.cancelAtPeriodEnd': !immediately,
                    'subscription.canceledAt': immediately ? new Date() : undefined,
                    stripeSubscriptionId: immediately ? null : user.stripeSubscriptionId,
                }
            );

            canceled = true;
        }

        // Handle Razorpay
        if (user.razorpaySubscriptionId && razorpaySub) {
            if (immediately) {
                await razorpay.subscriptions.cancel(user.razorpaySubscriptionId);
            } else {
                await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, 1); // 1 = cancel at cycle end
            }

            await User.updateOne(
                { clerkId: userId },
                {
                    'subscription.status': immediately ? 'canceled' : 'active',
                    'subscription.plan': immediately ? 'free' : user.subscription?.plan,
                    'subscription.cancelAtPeriodEnd': !immediately,
                    'subscription.canceledAt': immediately ? new Date() : undefined,
                    razorpaySubscriptionId: immediately ? null : user.razorpaySubscriptionId,
                }
            );

            canceled = true;
        }

        if (!canceled) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            canceledImmediately: immediately,
            message: immediately
                ? 'Subscription canceled immediately'
                : 'Subscription will cancel at end of billing period',
        });
    } catch (error) {
        console.error('DELETE subscription error:', error);
        return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }
}