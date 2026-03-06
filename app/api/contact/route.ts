// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    company: z.string().max(100).optional(),
    phone: z.string().max(30).optional(),
    inquiryType: z.string().min(1),
    subject: z.string().min(2).max(200),
    message: z.string().min(10).max(5000),
});

/**
 * POST /api/contact
 * Validates and stores a contact form submission.
 * If RESEND_API_KEY or SMTP_* env vars are configured, sends a notification email.
 * Otherwise stores in the DB/logs for manual review.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = contactSchema.parse(body);

        const emailHtml = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ""}
      ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
      <p><strong>Inquiry Type:</strong> ${data.inquiryType}</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>${data.message.replace(/\n/g, "<br />")}</p>
    `;

        // --- Resend integration (if configured) ---
        if (process.env.RESEND_API_KEY) {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
                from: "contact@removation.ai",
                to: process.env.CONTACT_EMAIL || "hello@removation.ai",
                replyTo: data.email,
                subject: `[Contact] ${data.inquiryType}: ${data.subject}`,
                html: emailHtml,
            });
        } else {
            // Log to console when no email service is configured
            console.log("[CONTACT FORM]", JSON.stringify(data, null, 2));
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[CONTACT_POST]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}
