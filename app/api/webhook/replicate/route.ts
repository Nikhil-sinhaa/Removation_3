// app/api/webhook/replicate/route.ts
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Render } from '@/lib/db/models/Render';
import { User } from '@/lib/db/models/User';

const webhookSecret = process.env.REPLICATE_WEBHOOK_SECRET || '';

interface ReplicateWebhookPayload {
    id: string;
    version: string;
    status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
    input: Record<string, any>;
    output: string | string[] | null;
    error: string | null;
    logs: string;
    metrics: {
        predict_time: number;
        total_time: number;
    };
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
    urls: {
        get: string;
        cancel: string;
    };
}

function verifyWebhookSignature(
    body: string,
    signature: string | null,
    secret: string
): boolean {
    if (!signature || !secret) return true; // Skip if no secret configured

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(`sha256=${expectedSignature}`)
    );
}

export async function POST(req: NextRequest) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('webhook-signature');

    // Verify signature if secret is configured
    if (webhookSecret) {
        const isValid = verifyWebhookSignature(body, signature, webhookSecret);

        if (!isValid) {
            console.error('Replicate webhook signature verification failed');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }
    }

    const payload: ReplicateWebhookPayload = JSON.parse(body);

    try {
        await connectToDatabase();

        // Find the render by prediction ID
        const render = await Render.findOne({ predictionId: payload.id });

        if (!render) {
            console.log(`No render found for prediction: ${payload.id}`);
            return NextResponse.json({ received: true, found: false });
        }

        switch (payload.status) {
            case 'starting': {
                await Render.findByIdAndUpdate(render._id, {
                    status: 'processing',
                    startedAt: payload.started_at ? new Date(payload.started_at) : new Date(),
                    updatedAt: new Date(),
                });
                break;
            }

            case 'processing': {
                await Render.findByIdAndUpdate(render._id, {
                    status: 'processing',
                    logs: payload.logs,
                    updatedAt: new Date(),
                });
                break;
            }

            case 'succeeded': {
                // Handle output - could be string or array
                let outputUrl = '';
                if (Array.isArray(payload.output)) {
                    outputUrl = payload.output[0] || '';
                } else if (typeof payload.output === 'string') {
                    outputUrl = payload.output;
                }

                await Render.findByIdAndUpdate(render._id, {
                    status: 'completed',
                    resultUrl: outputUrl,
                    outputUrls: Array.isArray(payload.output) ? payload.output : [payload.output],
                    completedAt: payload.completed_at ? new Date(payload.completed_at) : new Date(),
                    processingTime: payload.metrics?.total_time || 0,
                    logs: payload.logs,
                    updatedAt: new Date(),
                });

                // Update user's credits used
                await User.findOneAndUpdate(
                    { clerkId: render.clerkId },
                    {
                        $inc: { 'subscription.creditsUsed': 1 },
                        $set: { lastRenderAt: new Date() },
                    }
                );

                console.log(`Render completed: ${render._id}, output: ${outputUrl}`);
                break;
            }

            case 'failed': {
                await Render.findByIdAndUpdate(render._id, {
                    status: 'failed',
                    error: payload.error || 'Unknown error',
                    logs: payload.logs,
                    completedAt: new Date(),
                    updatedAt: new Date(),
                });

                // Refund the credit if it failed
                await User.findOneAndUpdate(
                    { clerkId: render.clerkId },
                    {
                        $inc: { 'subscription.credits': 1 },
                    }
                );

                console.error(`Render failed: ${render._id}, error: ${payload.error}`);
                break;
            }

            case 'canceled': {
                await Render.findByIdAndUpdate(render._id, {
                    status: 'canceled',
                    completedAt: new Date(),
                    updatedAt: new Date(),
                });

                // Refund the credit if canceled
                await User.findOneAndUpdate(
                    { clerkId: render.clerkId },
                    {
                        $inc: { 'subscription.credits': 1 },
                    }
                );

                console.log(`Render canceled: ${render._id}`);
                break;
            }
        }

        return NextResponse.json({
            received: true,
            renderId: render._id,
            status: payload.status,
        });
    } catch (error) {
        console.error('Error processing Replicate webhook:', error);
        return NextResponse.json(
            { error: 'Error processing webhook' },
            { status: 500 }
        );
    }
}

// Endpoint to manually check prediction status
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const predictionId = searchParams.get('predictionId');

    if (!predictionId) {
        return NextResponse.json(
            { error: 'Missing predictionId' },
            { status: 400 }
        );
    }

    try {
        await connectToDatabase();

        const render = await Render.findOne({ predictionId });

        if (!render) {
            return NextResponse.json(
                { error: 'Render not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            renderId: render._id,
            status: render.status,
            resultUrl: render.resultUrl,
            error: render.error,
        });
    } catch (error) {
        console.error('Error checking prediction status:', error);
        return NextResponse.json(
            { error: 'Error checking status' },
            { status: 500 }
        );
    }
}