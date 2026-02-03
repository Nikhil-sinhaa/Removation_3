// app/api/webhook/clerk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import  User  from '@/lib/db/models/User';

export async function POST(req: NextRequest) {
  // ✅ FIXED: Use req.headers instead of headers()
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  // No headers = reject
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Error verifying webhook' }, { status: 400 });
  }

  const eventType = evt.type;

  try {
    await connectToDatabase();

    switch (eventType) {
      case "user.created": {
        const { id, email_addresses, first_name, last_name, image_url, created_at } = evt.data;

        const primaryEmail = email_addresses?.find(
          email => email.id === evt.data.primary_email_address_id
        );

        const existing = await User.findOne({ clerkId: id });
        if (!existing) {
          await User.create({
            clerkId: id,
            email: primaryEmail?.email_address || "",
            firstName: first_name || "",
            lastName: last_name || "",
            imageUrl: image_url || "",
            subscription: {
              plan: "free",
              status: "active",
              credits: 10,
              creditsUsed: 0,
              resetDate: new Date(Date.now() + 30 * 86400000)
            },
            preferences: {
              language: "en",
              currency: "USD",
              notifications: {
                email: true,
                push: true,
                marketing: false,
              },
            },
            createdAt: new Date(created_at),
            updatedAt: new Date(),
          });

          console.log(`Created new user: ${id}`);
        }
        break;
      }

      case "user.updated": {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;

        const primaryEmail = email_addresses?.find(
          email => email.id === evt.data.primary_email_address_id
        );

        await User.findOneAndUpdate(
          { clerkId: id },
          {
            email: primaryEmail?.email_address,
            firstName: first_name || "",
            lastName: last_name || "",
            imageUrl: image_url || "",
            updatedAt: new Date()
          }
        );
        break;
      }

      case "user.deleted": {
        await User.findOneAndUpdate(
          { clerkId: evt.data.id },
          {
            isActive: false,
            deletedAt: new Date(),
            updatedAt: new Date(),
          }
        );
        break;
      }

      case "session.created": {
        await User.findOneAndUpdate(
          { clerkId: evt.data.user_id },
          {
            lastLoginAt: new Date(),
            $inc: { loginCount: 1 },
          }
        );
        break;
      }

      case "organization.created": {
        const { id, name, created_by } = evt.data;
        await User.findOneAndUpdate(
          { clerkId: created_by },
          {
            $push: {
              organizations: {
                orgId: id,
                name,
                role: "owner",
                joinedAt: new Date(),
              },
            },
          }
        );
        break;
      }

      case "organizationMembership.created": {
        const { organization, public_user_data } = evt.data;

        await User.findOneAndUpdate(
          { clerkId: public_user_data?.user_id },
          {
            $push: {
              organizations: {
                orgId: organization?.id,
                name: organization?.name,
                role: "member",
                joinedAt: new Date(),
              },
            },
          }
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true, type: eventType });

  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Clerk webhook endpoint active" });
}
