/**
 * Bootstrap Admin Script
 * ──────────────────────
 * Promotes an existing user to role='admin'.
 * Run ONCE manually after Phase 3 is deployed.
 *
 * Usage:
 *   node scripts/make-admin.mjs <email>
 *
 * Example:
 *   node scripts/make-admin.mjs nikhilkumarsinha4321@gmail.com
 *
 * Safe to re-run — idempotent (no-op if already admin).
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/removation_ai';

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    role:  { type: String, enum: ['customer', 'designer', 'admin'], default: 'customer' },
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function main() {
    const email = process.argv[2];

    if (!email || !email.includes('@')) {
        console.error('❌  Usage: node scripts/make-admin.mjs <email>');
        process.exit(1);
    }

    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('Connected.\n');

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
        console.error(`❌  No user found with email: ${email}`);
        console.error('    Make sure the user has signed up first.');
        process.exit(1);
    }

    if (user.role === 'admin') {
        console.log(`ℹ️   User "${email}" is already an admin. No changes made.`);
        await mongoose.disconnect();
        return;
    }

    const previousRole = user.role;
    await User.findByIdAndUpdate(user._id, { role: 'admin' });

    console.log(`✅  Success!`);
    console.log(`    Email : ${email}`);
    console.log(`    Before: role="${previousRole}"`);
    console.log(`    After : role="admin"`);
    console.log(`\n    This user can now access /api/admin/* routes.`);

    await mongoose.disconnect();
}

main().catch(err => {
    console.error('Script crashed:', err.message);
    process.exit(1);
});
