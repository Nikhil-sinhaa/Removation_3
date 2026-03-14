// app/api/invoices/[id]/email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";

/**
 * POST /api/invoices/:id/email
 * Triggers Stripe to re-send the invoice email to the customer.
 * Only works for Stripe-issued invoices (prefix: "in_").
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const invoiceId = resolvedParams.id;
        
        // TESTING: Bypass auth for development
        const userId = "test-user-123";
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!invoiceId.startsWith("in_")) {
            // Razorpay invoices — no server-side email trigger available
            return NextResponse.json(
                { error: "Email sending not supported for this payment provider" },
                { status: 422 }
            );
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
        }

        // Verify the invoice belongs to this user
        await connectToDatabase();
        const user = await User.findOne({ clerkId: userId }).lean();
        if (!user?.stripeCustomerId) {
            return NextResponse.json({ error: "No Stripe customer" }, { status: 400 });
        }

        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2024-06-20",
        });

        const invoice = await stripe.invoices.retrieve(invoiceId);
        if (invoice.customer !== user.stripeCustomerId) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        await stripe.invoices.sendInvoice(invoiceId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[INVOICE_EMAIL_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
