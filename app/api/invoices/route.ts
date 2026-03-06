// app/api/invoices/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";

/**
 * GET /api/invoices
 * Returns the authenticated user's invoice history from Stripe and/or Razorpay.
 * Falls back to an empty array if neither payment provider is configured.
 */
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const user = await User.findOne({ clerkId: userId }).lean();
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const invoices: any[] = [];

        // ── Stripe ──────────────────────────────────────────────────────────────
        if (user.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
            const Stripe = (await import("stripe")).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
                apiVersion: "2024-06-20",
            });

            const stripeInvoices = await stripe.invoices.list({
                customer: user.stripeCustomerId,
                limit: 24,
                expand: ["data.payment_intent"],
            });

            for (const inv of stripeInvoices.data) {
                invoices.push({
                    id: inv.id,
                    invoiceNumber: inv.number ?? inv.id,
                    date: new Date(inv.created * 1000),
                    dueDate: inv.due_date ? new Date(inv.due_date * 1000) : new Date(inv.created * 1000),
                    paidAt: inv.status_transitions?.paid_at
                        ? new Date(inv.status_transitions.paid_at * 1000)
                        : undefined,
                    amount: (inv.amount_paid ?? inv.amount_due) / 100,
                    currency: (inv.currency.toUpperCase() as "INR" | "USD"),
                    status: mapStripeStatus(inv.status ?? "draft"),
                    plan: inv.lines.data[0]?.description ?? "Subscription",
                    billingPeriod: {
                        start: new Date((inv.lines.data[0]?.period?.start ?? inv.created) * 1000),
                        end: new Date((inv.lines.data[0]?.period?.end ?? inv.created) * 1000),
                    },
                    paymentMethod: resolveStripePaymentMethod(inv),
                    customer: {
                        name: inv.customer_name ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
                        email: inv.customer_email ?? user.email ?? "",
                        address: inv.customer_address
                            ? {
                                line1: inv.customer_address.line1 ?? "",
                                line2: inv.customer_address.line2 ?? undefined,
                                city: inv.customer_address.city ?? "",
                                state: inv.customer_address.state ?? "",
                                postalCode: inv.customer_address.postal_code ?? "",
                                country: inv.customer_address.country ?? "",
                            }
                            : undefined,
                        gstin: (inv.customer_tax_ids?.[0]?.value) ?? undefined,
                    },
                    items: inv.lines.data.map((line) => ({
                        description: line.description ?? "",
                        quantity: line.quantity ?? 1,
                        unitPrice: ((line.unit_amount_excluding_tax as number | null) ?? line.amount) / 100,
                        amount: line.amount / 100,
                    })),
                    subtotal: (inv.subtotal ?? 0) / 100,
                    tax: (inv.tax ?? 0) / 100,
                    taxRate: inv.tax ? Math.round(((inv.tax / (inv.subtotal || 1)) * 100) * 100) / 100 : 0,
                    total: (inv.total ?? 0) / 100,
                    downloadUrl: inv.invoice_pdf ?? inv.hosted_invoice_url ?? "#",
                    receiptUrl: inv.hosted_invoice_url ?? undefined,
                    provider: "stripe",
                });
            }
        }

        // ── Razorpay ─────────────────────────────────────────────────────────────
        if (user.razorpaySubscriptionId && process.env.RAZORPAY_KEY_ID) {
            const Razorpay = (await import("razorpay")).default;
            const rp = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID!,
                key_secret: process.env.RAZORPAY_KEY_SECRET!,
            });

            try {
                // Fetch invoices linked to this subscription
                const rpInvoices = await rp.invoices.all({
                    subscription_id: user.razorpaySubscriptionId,
                    count: 24,
                } as any);

                for (const inv of (rpInvoices as any).items ?? []) {
                    invoices.push({
                        id: inv.id,
                        invoiceNumber: inv.id,
                        date: new Date(inv.date * 1000),
                        dueDate: new Date(inv.date * 1000),
                        paidAt: inv.paid_at ? new Date(inv.paid_at * 1000) : undefined,
                        amount: (inv.amount ?? 0) / 100,
                        currency: "INR" as const,
                        status: inv.status === "paid" ? "paid" : inv.status === "cancelled" ? "cancelled" : "pending",
                        plan: inv.description ?? "Subscription",
                        billingPeriod: {
                            start: new Date(inv.billing_start * 1000),
                            end: new Date(inv.billing_end * 1000),
                        },
                        paymentMethod: { type: "upi" as const },
                        customer: {
                            name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
                            email: user.email ?? "",
                        },
                        items: [
                            {
                                description: inv.description ?? "Subscription",
                                quantity: 1,
                                unitPrice: (inv.amount ?? 0) / 100,
                                amount: (inv.amount ?? 0) / 100,
                            },
                        ],
                        subtotal: (inv.amount ?? 0) / 100,
                        tax: 0,
                        taxRate: 0,
                        total: (inv.amount ?? 0) / 100,
                        downloadUrl: inv.short_url ?? "#",
                        provider: "razorpay",
                    });
                }
            } catch (rpErr) {
                console.error("[INVOICES] Razorpay fetch error:", rpErr);
            }
        }

        // Sort by date descending
        invoices.sort((a, b) => b.date.getTime() - a.date.getTime());

        return NextResponse.json({ invoices });
    } catch (error) {
        console.error("[INVOICES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function mapStripeStatus(status: string): "paid" | "pending" | "failed" | "refunded" | "cancelled" {
    switch (status) {
        case "paid":
            return "paid";
        case "void":
        case "uncollectible":
            return "cancelled";
        case "open":
            return "pending";
        default:
            return "pending";
    }
}

function resolveStripePaymentMethod(inv: any) {
    const pm = inv.payment_intent?.payment_method;
    if (pm?.type === "card") {
        return {
            type: "card" as const,
            last4: pm.card?.last4,
            brand: pm.card?.brand,
        };
    }
    if (pm?.type === "upi") {
        return { type: "upi" as const, upiId: pm.upi?.vpa };
    }
    if (pm?.type === "netbanking") {
        return { type: "netbanking" as const };
    }
    return { type: "card" as const };
}
