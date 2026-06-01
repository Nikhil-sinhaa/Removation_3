// app/api/webhook/stripe/route.ts
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
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

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Plan credit mappings
const PLAN_CREDITS: Record<string, number> = {
    'price_pro_monthly': 100,
    'price_pro_yearly': 100,
    'price_team_monthly': 500,
    'price_team_yearly': 500,
};

export async function POST(req: NextRequest) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
        return NextResponse.json(
            { error: 'Missing stripe-signature header' },
            { status: 400 }
        );
    }

    const stripe = getStripe();
    if (!stripe) {
        return NextResponse.json(
            { error: 'Stripe is not configured on this server.' },
            { status: 503 }
        );
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json(
            { error: `Webhook Error: ${err.message}` },
            { status: 400 }
        );
    }

    try {
        await connectToDatabase();

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;

                if (session.mode === 'subscription') {
                    await handleSubscriptionCheckout(session);
                } else if (session.mode === 'payment') {
                    await handleOneTimePayment(session);
                }
                break;
            }

            case 'customer.subscription.created': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionCreated(subscription);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionCanceled(subscription);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaymentSucceeded(invoice);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaymentFailed(invoice);
                break;
            }

            case 'customer.created': {
                const customer = event.data.object as Stripe.Customer;
                await handleCustomerCreated(customer);
                break;
            }

            default:
                console.log(`Unhandled Stripe event type: ${event.type}`);
        }

        return NextResponse.json({ received: true, type: event.type });
    } catch (error) {
        console.error('Error processing Stripe webhook:', error);
        return NextResponse.json(
            { error: 'Error processing webhook' },
            { status: 500 }
        );
    }
}

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
    const stripe = getStripe();
    if (!stripe) {
        console.error('[Stripe webhook] Stripe not configured');
        return;
    }

    const clerkId = session.metadata?.clerkId;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!clerkId) {
        console.error('No clerkId in session metadata');
        return;
    }

    // Retrieve the subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price.id;

    // Determine plan type
    let plan = 'pro';
    if (priceId?.includes('team')) {
        plan = 'team';
    }

    const credits = PLAN_CREDITS[priceId] || 100;

    // Update user
    await User.findOneAndUpdate(
        { clerkId },
        {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            'subscription.plan': plan,
            'subscription.status': 'active',
            'subscription.credits': credits,
            'subscription.creditsUsed': 0,
            'subscription.priceId': priceId,
            'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
            'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
            'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
            updatedAt: new Date(),
        }
    );

    // Create subscription record
    await Subscription.findOneAndUpdate(
        { clerkId },
        {
            clerkId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan,
            status: 'active',
            priceId,
            amount: subscription.items.data[0]?.price.unit_amount || 0,
            currency: subscription.currency,
            interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            updatedAt: new Date(),
        },
        { upsert: true, new: true }
    );

    console.log(`Subscription created for user: ${clerkId}, plan: ${plan}`);
}

async function handleOneTimePayment(session: Stripe.Checkout.Session) {
    const clerkId = session.metadata?.clerkId;
    const creditsToAdd = parseInt(session.metadata?.credits || '0');

    if (!clerkId) return;

    // Add credits for one-time purchase
    await User.findOneAndUpdate(
        { clerkId },
        {
            $inc: { 'subscription.credits': creditsToAdd },
            updatedAt: new Date(),
        }
    );

    console.log(`Added ${creditsToAdd} credits to user: ${clerkId}`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Find user by customer ID
    const user = await User.findOne({ stripeCustomerId: customerId });

    if (user) {
        const priceId = subscription.items.data[0]?.price.id;
        let plan: 'pro' | 'team' | 'free' = 'pro';
        if (priceId?.includes('team')) {
            plan = 'team';
        }

        user.subscription.plan = plan;
        user.subscription.status = 'active';
        user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        user.updatedAt = new Date();
        await user.save();
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const user = await User.findOne({ stripeCustomerId: customerId });

    if (user) {
        const priceId = subscription.items.data[0]?.price.id;
        let plan = 'pro';
        if (priceId?.includes('team')) {
            plan = 'team';
        }

        let status: 'active' | 'canceled' | 'past_due' | 'trialing' = 'active';
        if (subscription.status === 'past_due') status = 'past_due';
        if (subscription.status === 'canceled') status = 'canceled';
        if (subscription.status === 'trialing') status = 'trialing';

        await User.findOneAndUpdate(
            { stripeCustomerId: customerId },
            {
                'subscription.plan': plan,
                'subscription.status': status,
                'subscription.priceId': priceId,
                'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
                'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
                'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
                updatedAt: new Date(),
            }
        );

        // Update subscription record
        await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: subscription.id },
            {
                status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                updatedAt: new Date(),
            }
        );
    }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    await User.findOneAndUpdate(
        { stripeCustomerId: customerId },
        {
            'subscription.status': 'canceled',
            'subscription.canceledAt': new Date(),
            updatedAt: new Date(),
        }
    );

    await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        {
            status: 'canceled',
            canceledAt: new Date(),
            updatedAt: new Date(),
        }
    );

    console.log(`Subscription canceled for customer: ${customerId}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const stripe = getStripe();
    if (!stripe) {
        console.error('[Stripe webhook] Stripe not configured');
        return;
    }

    const customerId = invoice.customer as string;
    const subscriptionId = invoice.subscription as string;

    if (!subscriptionId) return; // One-time payment

    const user = await User.findOne({ stripeCustomerId: customerId });

    if (user) {
        // Reset credits on successful payment (billing cycle renewal)
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const credits = PLAN_CREDITS[priceId] || 100;

        await User.findOneAndUpdate(
            { stripeCustomerId: customerId },
            {
                'subscription.credits': credits,
                'subscription.creditsUsed': 0,
                'subscription.status': 'active',
                'subscription.lastPaymentDate': new Date(),
                updatedAt: new Date(),
            }
        );

        console.log(`Credits reset for user ${user.clerkId}: ${credits} credits`);
    }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    await User.findOneAndUpdate(
        { stripeCustomerId: customerId },
        {
            'subscription.status': 'past_due',
            'subscription.lastPaymentFailedDate': new Date(),
            updatedAt: new Date(),
        }
    );

    // TODO: Send email notification about payment failure
    console.log(`Payment failed for customer: ${customerId}`);
}

async function handleCustomerCreated(customer: Stripe.Customer) {
    if (customer.metadata?.clerkId) {
        await User.findOneAndUpdate(
            { clerkId: customer.metadata.clerkId },
            {
                stripeCustomerId: customer.id,
                updatedAt: new Date(),
            }
        );
    }
}

export async function GET() {
    return NextResponse.json({ status: 'Stripe webhook endpoint active' });
}