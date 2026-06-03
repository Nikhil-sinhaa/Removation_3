import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedDefaultTours } from '../lib/tours/seedTours';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env helper
function loadEnv() {
  const root = path.resolve(__dirname, '..');
  const envLocalPath = path.join(root, '.env.local');
  const envPath = path.join(root, '.env');
  const pathToLoad = fs.existsSync(envLocalPath) ? envLocalPath : envPath;
  
  if (fs.existsSync(pathToLoad)) {
    const content = fs.readFileSync(pathToLoad, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index === -1) return;
      const key = trimmed.substring(0, index).trim();
      let val = trimmed.substring(index + 1).trim();
      // Strip optional quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    });
  }
}

async function run() {
  loadEnv();
  console.log('Starting tour seed...');
  await seedDefaultTours();
  console.log('Tour seeding complete. Exiting.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
