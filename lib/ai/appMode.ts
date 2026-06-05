import connectToDatabase from '../db/mongodb';
import { AdminConfig } from '../db/models/AdminConfig';
import { cache as redisCache } from '../redis/cache';

interface CachedConfig {
    appMode: 'development' | 'production';
    creditCosts: Record<string, number>;
    freeCreditsOnSignup: number;
}

const REDIS_KEY = 'admin_config_bundle';

async function fetchConfigFromDB(): Promise<CachedConfig> {
    await connectToDatabase();

    const configs = await AdminConfig.find({
        key: { $in: ['app_mode', 'credit_costs', 'free_credits_on_signup'] }
    });

    const configMap = new Map(configs.map((c: { key: string; value: unknown }) => [c.key, c.value]));

    const appMode = (configMap.get('app_mode') as 'development' | 'production') || 'development';
    const creditCosts = (configMap.get('credit_costs') as Record<string, number>) || {
        'room-changer': 1,
        'furniture-remover': 1,
        'redesign': 2
    };
    const freeCreditsOnSignup = Number(configMap.get('free_credits_on_signup') ?? 10);

    return { appMode, creditCosts, freeCreditsOnSignup };
}

async function getCachedConfig(): Promise<CachedConfig> {
    const cached = await redisCache.getAdminConfig<CachedConfig>(REDIS_KEY);
    if (cached) return cached;

    const config = await fetchConfigFromDB();
    // 60s TTL matches the old in-memory behaviour
    await redisCache.setAdminConfig(REDIS_KEY, config);
    return config;
}

export async function getAppMode(): Promise<'development' | 'production'> {
    const config = await getCachedConfig();
    return config.appMode;
}

export async function getCreditCosts(): Promise<Record<string, number>> {
    const config = await getCachedConfig();
    return config.creditCosts;
}

export async function getFreeCreditsOnSignup(): Promise<number> {
    const config = await getCachedConfig();
    return config.freeCreditsOnSignup;
}

export async function invalidateAppModeCache(): Promise<void> {
    await redisCache.delAdminConfig(REDIS_KEY);
}
