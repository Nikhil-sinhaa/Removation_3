import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

export const checkApiLimit = async () => {
    const { userId } = await auth();

    if (!userId) {
        return false;
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });

    if (!user || user.credits <= 0) {
        return false;
    }

    return true;
};

export const getApiLimitCount = async () => {
    const { userId } = await auth();

    if (!userId) {
        return 0;
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
        return 0;
    }

    return user.credits;
};

export const checkSubscription = async () => {
    const { userId } = await auth();

    if (!userId) {
        return false;
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
        return false;
    }

    const isValid =
        user.subscription &&
        user.subscription.status === "active" &&
        user.subscription.currentPeriodEnd &&
        user.subscription.currentPeriodEnd.getTime() + 86_400_000 > Date.now();

    return !!isValid;
};

export const checkAndDeductCredits = async (amount: number = 1) => {
    const { userId } = await auth();

    if (!userId) {
        return false;
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });

    if (!user || user.credits < amount) {
        return false;
    }

    // Deduct credits
    user.credits -= amount;

    // Update subscription usage if applicable
    if (user.subscription) {
        user.subscription.creditsUsed += amount;
    }

    await user.save();

    return true;
};

