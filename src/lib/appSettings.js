import AppSettings from '../models/AppSettings.js';
import { connectDB } from './mongodb.js';

const DEFAULTS = {
  COMFYUI_MODE: 'local',   // 'local' | 'auto' | 'cloud'
  COMFYUI_CLOUD_URL: '',   // e.g. https://abc.trycloudflare.com
  GOOGLE_DRIVE_TOKENS: '', // JSON-stringified OAuth2 tokens
};

export async function getSetting(key) {
  await connectDB();
  const doc = await AppSettings.findOne({ key });
  return doc?.value ?? DEFAULTS[key] ?? null;
}

export async function setSetting(key, value) {
  await connectDB();
  await AppSettings.findOneAndUpdate(
    { key },
    { key, value, updatedAt: new Date() },
    { upsert: true, new: true }
  );
}

export async function getAllSettings() {
  await connectDB();
  const docs = await AppSettings.find({
    key: { $in: Object.keys(DEFAULTS) }
  });

  const result = { ...DEFAULTS };
  docs.forEach(d => { result[d.key] = d.value; });
  return result;
}
