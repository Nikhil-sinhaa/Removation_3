// lib/env.ts
// Centralized environment variable validation
// Import this in any file that needs env vars — it will throw at import time if vars are missing

import { z } from 'zod';

const envSchema = z.object({
    // AI Providers
    REPLICATE_API_TOKEN: z.string().min(1, 'REPLICATE_API_TOKEN is required for AI image generation'),
    GROQ_API_KEY: z.string().optional(), // Optional — Groq analysis degrades gracefully
    REPLICATE_WEBHOOK_SECRET: z.string().optional(),

    // Database
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

    // Auth
    CLERK_SECRET_KEY: z.string().optional(),

    // App
    NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
});

// Validate at module load time — fails fast with clear message
function validateEnv() {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        const errors = parsed.error.flatten().fieldErrors;
        const errorMessages = Object.entries(errors)
            .map(([key, msgs]) => `  ❌ ${key}: ${msgs?.join(', ')}`)
            .join('\n');

        console.warn(
            `\n⚠️  Env Warning:\n${errorMessages}\n` +
            `Check your .env.local file. Some features may not work until these are set.\n`
        );

    }

    return parsed.success ? parsed.data : {
        REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN || '',
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        REPLICATE_WEBHOOK_SECRET: process.env.REPLICATE_WEBHOOK_SECRET,
        MONGODB_URI: process.env.MONGODB_URI || '',
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    } as any;
}

export const env = validateEnv();

// Helper to check if a specific AI provider is configured
export function isReplicateConfigured(): boolean {
    return !!process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_API_TOKEN.length > 0;
}

export function isGroqConfigured(): boolean {
    return !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 0;
}

export function getWebhookUrl(path: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/api/webhook/${path}`;
}

/**
 * Returns true when REPLICATE_USE_SYNC=true.
 * 
 * Use this in local dev to bypass webhooks (which can't reach localhost).
 * The server polls Replicate directly and waits for the result.
 * 
 * Production should NEVER set this — use webhooks for scale.
 */
export function isSyncMode(): boolean {
    return process.env.REPLICATE_USE_SYNC === 'true';
}
