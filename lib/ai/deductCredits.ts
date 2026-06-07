import mongoose from 'mongoose';
import connectToDatabase from '../db/mongodb';
import { User } from '../db/models/User';
import { getAppMode, getCreditCosts } from './appMode';

export interface DeductionResult {
    success: boolean;
    mode: 'development' | 'production';
    cost: number;
    remaining: number;
    reason?: string;
    code?: 'USER_NOT_FOUND' | 'INSUFFICIENT_CREDITS' | 'ERROR';
}

export interface DeductOptions {
    source?: string;
}

/**
 * Validates and atomically deducts credits for a user's AI action.
 * Bypasses deduction if the application is in development mode or if the
 * action is tagged as an onboarding render for a user who hasn't yet completed
 * onboarding (first-run free transform).
 *
 * @param userId - The Clerk ID or Mongoose ObjectId of the user.
 * @param actionKey - The AI action type (e.g., 'room-changer', 'furniture-remover').
 * @param options - Optional flags; source='onboarding' triggers free-render bypass.
 * @returns DeductionResult
 */
export async function checkAndDeductCredits(
    userId: string,
    actionKey: string,
    options?: DeductOptions
): Promise<DeductionResult> {
    try {
        await connectToDatabase();

        // 1. Resolve user first
        let user = await User.findOne({ clerkId: userId });
        if (!user && mongoose.Types.ObjectId.isValid(userId)) {
            user = await User.findById(userId);
        }

        if (!user) {
            return {
                success: false,
                mode: 'development', // default fallback
                cost: 0,
                remaining: 0,
                reason: 'User not found',
                code: 'USER_NOT_FOUND'
            };
        }

        // 2. Onboarding bypass — first render is free while onboarding is incomplete
        if (options?.source === 'onboarding' && user.onboardingCompleted === false) {
            await User.updateOne(
                { _id: user._id },
                { $set: { lastRenderAt: new Date() } }
            );
            const remaining = user.subscription
            ? user.subscription.credits - user.subscription.creditsUsed
            : (user.credits ?? 0);
            return { success: true, mode: 'development', cost: 0, remaining };
        }

        // 3. Fetch app mode config
        const mode = await getAppMode();

        // 3. Handle Development Mode (Bypass deductions)
        if (mode === 'development') {
            await User.updateOne(
                { _id: user._id },
                { $set: { lastRenderAt: new Date() } }
            );

            const remaining = user.subscription
                ? user.subscription.credits - user.subscription.creditsUsed
                : (user.credits ?? 0);
            return {
                success: true,
                mode: 'development',
                cost: 0,
                remaining
            };
        }

        // 4. Handle Production Mode (Enforce and deduct)
        const DEFAULT_TOOL_COSTS: Record<string, number> = {
            'auto-edit': 1,
            'background': 1,
            'ceiling-changer': 1,
            'collage': 1,
            'edit': 1,
            'recolor': 1,
            'segment': 1,
            'remove-object': 1,
            'lineart': 1,
            'postprocess': 1,
            'view-extend': 1,
            'furniture-placement/generate': 2,
            'furnish': 2,
            'empty-room': 2,
            'landscape': 2,
            'lighting': 2,
            'style-transfer': 2,
            'render': 2,
            'interior-render': 3,
            'exterior-render': 3,
            'ultra-pro': 3,
            'redesign': 3,
            'furniture-placement/remove-bg': 0
        };

        const creditCosts = await getCreditCosts();
        const cost = creditCosts[actionKey] ?? DEFAULT_TOOL_COSTS[actionKey] ?? 1;

        const remainingBefore = user.subscription
            ? user.subscription.credits - user.subscription.creditsUsed
            : (user.credits ?? 0);

        // PAY-07: Block canceled/past_due/halted/unpaid paid-plan subscriptions
        // Free plan users (plan='free', status='inactive') must NOT be blocked
        const blockedStatuses = ['canceled', 'past_due', 'halted', 'unpaid'];
        const isPaidPlan = user.subscription?.plan === 'pro' || user.subscription?.plan === 'team';
        const isBlocked = isPaidPlan && blockedStatuses.includes(user.subscription?.status ?? '');
        if (isBlocked) {
            return {
                success: false,
                mode: 'production',
                cost: 0,
                remaining: 0,
                reason: 'Subscription is not active',
                code: 'INSUFFICIENT_CREDITS'
            };
        }

        if (remainingBefore < cost) {
            return {
                success: false,
                mode: 'production',
                cost,
                remaining: remainingBefore,
                reason: 'Insufficient credits',
                code: 'INSUFFICIENT_CREDITS'
            };
        }

        // Atomically decrement available balance by incrementing creditsUsed and decrementing credits
        const updatedUser = await User.findOneAndUpdate(
            {
                _id: user._id,
                $expr: {
                    $gte: [
                        { $subtract: ['$subscription.credits', '$subscription.creditsUsed'] },
                        cost
                    ]
                }
            },
            {
                $inc: { 
                    'subscription.creditsUsed': cost,
                    'credits': -cost
                },
                $set: { lastRenderAt: new Date(), updatedAt: new Date() },
                $push: {
                    creditHistory: {
                        amount: -cost,
                        type: actionKey,
                        description: `${actionKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} generation`,
                        createdAt: new Date(),
                    }
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return {
                success: false,
                mode: 'production',
                cost,
                remaining: remainingBefore,
                reason: 'Insufficient credits (balance changed)',
                code: 'INSUFFICIENT_CREDITS'
            };
        }

        const remainingAfter = updatedUser.subscription
            ? updatedUser.subscription.credits - updatedUser.subscription.creditsUsed
            : (updatedUser.credits ?? 0);

        return {
            success: true,
            mode: 'production',
            cost,
            remaining: remainingAfter
        };
    } catch (error: any) {
        console.error('Error in checkAndDeductCredits:', error);
        return {
            success: false,
            mode: 'production',
            cost: 0,
            remaining: 0,
            reason: error.message || 'Internal database error during credit check',
            code: 'ERROR'
        };
    }
}
