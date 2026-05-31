// app/api/webhook/razorpay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import  User  from '@/lib/db/models/User';
import  Subscription  from '@/lib/db/models/Subscription';

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

// Razorpay plan → credits map
const PLAN_CREDITS: Record<string, number> = {
  plan_pro_monthly_inr: 100,
  plan_pro_yearly_inr: 100,
  plan_team_monthly_inr: 500,
  plan_team_yearly_inr: 500,
};

// Verify Razorpay signature
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

export async function POST(req: NextRequest) {
  // FIXED: do NOT use headers()
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text(); // must use text(), not json()

  // Verify webhook
  const isValid = verifyWebhookSignature(body, signature, webhookSecret);
  if (!isValid) {
    console.error("Invalid Razorpay signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Parse event
  const event = JSON.parse(body);

  try {
    await connectToDatabase();

    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event.payload.payment.entity);
        break;

      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      case "subscription.activated":
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;

      case "subscription.charged":
        await handleSubscriptionCharged(event.payload.subscription.entity);
        break;

      case "subscription.pending":
        await handleSubscriptionPending(event.payload.subscription.entity);
        break;

      case "subscription.halted":
        await handleSubscriptionHalted(event.payload.subscription.entity);
        break;

      case "subscription.cancelled":
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;

      case "subscription.completed":
        await handleSubscriptionCompleted(event.payload.subscription.entity);
        break;

      case "order.paid":
        await handleOrderPaid(event.payload.order.entity);
        break;

      default:
        console.log("Unhandled event:", event.event);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

// HANDLERS --------------------------------------------------

async function handlePaymentCaptured(payment: any) {
  const clerkId = payment.notes?.clerkId;
  if (!clerkId) return;

  if (payment.notes?.type === "credits") {
    const credits = parseInt(payment.notes?.credits || "0");

    await User.findOneAndUpdate(
      { clerkId },
      {
        $inc: { "subscription.credits": credits },
        $push: {
          paymentHistory: {
            paymentId: payment.id,
            amount: payment.amount / 100,
            currency: payment.currency,
            type: "credit_purchase",
            credits,
            status: "captured",
            createdAt: new Date(),
          },
        },
        updatedAt: new Date(),
      }
    );
  }
}

async function handlePaymentFailed(payment: any) {
  const clerkId = payment.notes?.clerkId;
  if (!clerkId) return;

  await User.findOneAndUpdate(
    { clerkId },
    {
      $push: {
        paymentHistory: {
          paymentId: payment.id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: "failed",
          createdAt: new Date(),
        },
      },
      updatedAt: new Date(),
    }
  );
}

async function handleSubscriptionActivated(sub: any) {
  const clerkId = sub.notes?.clerkId;
  if (!clerkId) return;

  const planId = sub.plan_id;
  const plan = planId.includes("team") ? "team" : "pro";
  const credits = PLAN_CREDITS[planId] || 100;

  await User.findOneAndUpdate(
    { clerkId },
    {
      razorpayCustomerId: sub.customer_id,
      razorpaySubscriptionId: sub.id,
      "subscription.plan": plan,
      "subscription.status": "active",
      "subscription.credits": credits,
      "subscription.creditsUsed": 0,
      "subscription.planId": planId,
      "subscription.currentPeriodStart": new Date(sub.current_start * 1000),
      "subscription.currentPeriodEnd": new Date(sub.current_end * 1000),
      updatedAt: new Date(),
    }
  );

  await Subscription.findOneAndUpdate(
    { clerkId },
    {
      clerkId,
      razorpayCustomerId: sub.customer_id,
      razorpaySubscriptionId: sub.id,
      plan,
      status: "active",
      planId,
      currentPeriodStart: new Date(sub.current_start * 1000),
      currentPeriodEnd: new Date(sub.current_end * 1000),
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
}

async function handleSubscriptionCharged(sub: any) {
  const clerkId = sub.notes?.clerkId;
  if (!clerkId) return;

  const planId = sub.plan_id;
  const plan = planId.includes("team") ? "team" : "pro";
  const credits = PLAN_CREDITS[planId] || 100;
  const currentPeriodStart = sub.current_start ? new Date(sub.current_start * 1000) : new Date();
  const currentPeriodEnd = sub.current_end ? new Date(sub.current_end * 1000) : new Date(Date.now() + 30 * 86400000);

  await User.findOneAndUpdate(
    { clerkId },
    {
      razorpayCustomerId: sub.customer_id,
      razorpaySubscriptionId: sub.id,
      "subscription.plan": plan,
      "subscription.status": "active",
      "subscription.credits": credits,
      "subscription.creditsUsed": 0,
      "subscription.planId": planId,
      "subscription.currentPeriodStart": currentPeriodStart,
      "subscription.currentPeriodEnd": currentPeriodEnd,
      "subscription.paymentMethod": "razorpay",
      credits: credits, // Sync legacy root field
      updatedAt: new Date(),
    }
  );

  await Subscription.findOneAndUpdate(
    { clerkId },
    {
      clerkId,
      razorpayCustomerId: sub.customer_id,
      razorpaySubscriptionId: sub.id,
      plan,
      status: "active",
      planId,
      currentPeriodStart,
      currentPeriodEnd,
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
}

async function handleSubscriptionPending(sub: any) {
  const clerkId = sub.notes?.clerkId;
  if (!clerkId) return;

  await User.findOneAndUpdate(
    { clerkId },
    { "subscription.status": "pending", updatedAt: new Date() }
  );

  await Subscription.findOneAndUpdate(
    { clerkId },
    { status: "pending", updatedAt: new Date() }
  );
}

async function handleSubscriptionHalted(sub: any) {
  const clerkId = sub.notes?.clerkId;
  if (!clerkId) return;

  await User.findOneAndUpdate(
    { clerkId },
    { "subscription.status": "past_due", updatedAt: new Date() }
  );

  await Subscription.findOneAndUpdate(
    { clerkId },
    { status: "past_due", updatedAt: new Date() }
  );
}

async function handleSubscriptionCancelled(sub: any) {
  const clerkId = sub.notes?.clerkId;
  if (!clerkId) return;

  await User.findOneAndUpdate(
    { clerkId },
    {
      "subscription.status": "canceled",
      "subscription.canceledAt": new Date(),
      updatedAt: new Date(),
    }
  );

  await Subscription.findOneAndUpdate(
    { clerkId },
    { status: "canceled", canceledAt: new Date(), updatedAt: new Date() }
  );
}

async function handleSubscriptionCompleted(sub: any) {
  const clerkId = sub.notes?.clerkId;
  if (!clerkId) return;

  await User.findOneAndUpdate(
    { clerkId },
    {
      "subscription.status": "completed",
      "subscription.plan": "free",
      updatedAt: new Date(),
    }
  );

  await Subscription.findOneAndUpdate(
    { clerkId },
    { status: "completed", plan: "free", updatedAt: new Date() }
  );
}

async function handleOrderPaid(order: any) {
  const clerkId = order.notes?.clerkId;
  if (!clerkId) return;

  const credits = parseInt(order.notes?.credits || "0");

  if (credits > 0) {
    await User.findOneAndUpdate(
      { clerkId },
      {
        $inc: { "subscription.credits": credits },
        updatedAt: new Date(),
      }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "Razorpay webhook active" });
}
