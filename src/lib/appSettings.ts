import { connectToDatabase } from '@/lib/db/mongodb';
import AppSettings from '../models/AppSettings.js';

interface SettingsDefaults {
  COMFYUI_MODE: string;
  COMFYUI_CLOUD_URL: string;
  GOOGLE_DRIVE_TOKENS: string;
  [key: string]: string;
}

const DEFAULTS: SettingsDefaults = {
  COMFYUI_MODE: 'local',   // 'local' | 'auto' | 'cloud'
  COMFYUI_CLOUD_URL: '',   // e.g. https://abc.trycloudflare.com
  GOOGLE_DRIVE_TOKENS: '', // JSON-stringified OAuth2 tokens
};

export async function getSetting(key: string): Promise<string | null> {
  await connectToDatabase();
  const doc = await AppSettings.findOne({ key });
  return doc?.value ?? DEFAULTS[key] ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await connectToDatabase();
  await AppSettings.findOneAndUpdate(
    { key },
    { key, value, updatedAt: new Date() },
    { upsert: true, new: true }
  );
}

export async function getAllSettings(): Promise<SettingsDefaults> {
  await connectToDatabase();
  const docs = await AppSettings.find({
    key: { $in: Object.keys(DEFAULTS) },
  });

  const result: SettingsDefaults = { ...DEFAULTS };
  docs.forEach((d: { key: string; value: string }) => {
    result[d.key] = d.value;
  });
  return result;
}
