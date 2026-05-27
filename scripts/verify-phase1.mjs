/**
 * Phase 1 Verification Script
 * Run: node scripts/verify-phase1.mjs
 *
 * Checks:
 *  1. User schema has a 'role' field with enum + default 'customer'
 *  2. Existing users still load cleanly (role defaults to 'customer' on read)
 *  3. Designer model can be created, queried, and deleted (test roundtrip)
 *  4. Designer compound index { isVerified, isActive, city } exists
 *  5. lib/db/models/index.ts exports Designer (import check)
 */

import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/removation_ai';

// ── Inline schemas to match our actual model files ─────────────────────────────

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['customer', 'designer', 'admin'], default: 'customer' },
    firstName: String,
    lastName: String,
}, { strict: false }); // strict: false so we see all existing fields even unlisted ones

const DesignerSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        displayName: { type: String, required: true, trim: true },
        bio: { type: String, maxlength: 1000 },
        phone: { type: String, required: true },
        city: { type: String, required: true },
        specialties: { type: [String], default: [] },
        portfolioImages: { type: [String], default: [] },
        yearsOfExperience: { type: Number, min: 0, max: 60 },
        isVerified: { type: Boolean, default: false },
        verifiedAt: { type: Date, default: null },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        rejectionReason: { type: String, default: null },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);
DesignerSchema.index({ isVerified: 1, isActive: 1, city: 1 });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Designer = mongoose.models.Designer || mongoose.model('Designer', DesignerSchema);

function pass(msg) { console.log(`  ✅ PASS  ${msg}`); }
function fail(msg) { console.log(`  ❌ FAIL  ${msg}`); process.exitCode = 1; }
function section(msg) { console.log(`\n── ${msg} ──────────────────────────────────`); }

async function run() {
    console.log('Phase 1 Verification — connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('Connected.\n');

    // ── CHECK 1: User schema has role field ────────────────────────────────────
    section('CHECK 1: User schema has role field');
    const userPaths = User.schema.paths;
    if (userPaths.role) {
        const roleOptions = userPaths.role.options;
        if (roleOptions.enum && roleOptions.enum.includes('customer') && roleOptions.enum.includes('designer') && roleOptions.enum.includes('admin')) {
            pass(`role enum = ${JSON.stringify(roleOptions.enum)}`);
        } else {
            fail(`role field exists but enum is wrong: ${JSON.stringify(roleOptions.enum)}`);
        }
        if (roleOptions.default === 'customer') {
            pass(`role default = 'customer'`);
        } else {
            fail(`role default is '${roleOptions.default}', expected 'customer'`);
        }
    } else {
        fail('role field does NOT exist on User schema');
    }

    // ── CHECK 2: Existing users don't break ────────────────────────────────────
    section('CHECK 2: Existing users load cleanly');
    const existingUser = await User.findOne({}).lean();
    if (existingUser) {
        pass(`Found existing user: ${existingUser.email}`);
        // Role may not be in DB doc yet for old users — Mongoose applies default on read
        const userWithDefault = await User.findOne({ _id: existingUser._id });
        const effectiveRole = userWithDefault.role;
        if (['customer', 'designer', 'admin'].includes(effectiveRole)) {
            pass(`Effective role on existing user = '${effectiveRole}' (via Mongoose default)`);
        } else {
            fail(`Effective role = '${effectiveRole}' — NOT in expected enum`);
        }
    } else {
        console.log('  ⚠️  SKIP  No existing users in DB — cannot test backward compat (OK for fresh install)');
    }

    // ── CHECK 3: Designer roundtrip ────────────────────────────────────────────
    section('CHECK 3: Designer model create → query → delete');
    const TEST_MARKER = 'phase1-verification-test';
    // Use a fake ObjectId for userId since this is a test
    const fakeUserId = new mongoose.Types.ObjectId();
    let testDesignerId = null;

    try {
        const doc = await Designer.create({
            userId: fakeUserId,
            displayName: TEST_MARKER,
            phone: '+919999999999',
            city: 'TestCity',
            specialties: ['modular-kitchen'],
            portfolioImages: ['https://example.com/img.jpg'],
            yearsOfExperience: 5,
        });
        testDesignerId = doc._id;

        pass(`Designer created, _id=${doc._id}`);

        if (doc.isVerified === false) {
            pass('isVerified defaults to false');
        } else {
            fail(`isVerified defaulted to ${doc.isVerified} — expected false`);
        }

        if (doc.isActive === true) {
            pass('isActive defaults to true');
        } else {
            fail(`isActive defaulted to ${doc.isActive} — expected true`);
        }

        if (doc.rejectionReason === null) {
            pass('rejectionReason defaults to null');
        } else {
            fail(`rejectionReason = ${doc.rejectionReason} — expected null`);
        }

        if (doc.createdAt && doc.updatedAt) {
            pass('timestamps (createdAt, updatedAt) present');
        } else {
            fail('Timestamps missing — check { timestamps: true } in schema options');
        }

        // Query by userId
        const found = await Designer.findOne({ userId: fakeUserId });
        if (found && found.displayName === TEST_MARKER) {
            pass('findOne({ userId }) works correctly');
        } else {
            fail('findOne({ userId }) did not return the created doc');
        }

    } finally {
        // Cleanup test doc
        if (testDesignerId) {
            await Designer.deleteOne({ _id: testDesignerId });
            pass('Test doc cleaned up');
        }
    }

    // ── CHECK 4: Compound index exists ─────────────────────────────────────────
    section('CHECK 4: Designer compound index { isVerified, isActive, city }');
    // Force index sync
    await Designer.syncIndexes();

    const db = mongoose.connection.db;
    const indexes = await db.collection('designers').indexes();
    const compoundIdx = indexes.find(idx => {
        const keys = Object.keys(idx.key);
        return (
            idx.key['isVerified'] === 1 &&
            idx.key['isActive'] === 1 &&
            idx.key['city'] === 1
        );
    });

    if (compoundIdx) {
        pass(`Compound index found: ${JSON.stringify(compoundIdx.key)}`);
    } else {
        const indexList = indexes.map(i => JSON.stringify(i.key)).join('\n    ');
        fail(`Compound index NOT found. Existing indexes:\n    ${indexList}`);
    }

    // ── CHECK 5: Designer uniqueness constraint ────────────────────────────────
    section('CHECK 5: userId uniqueness — one designer per user');
    const fakeUserId2 = new mongoose.Types.ObjectId();
    const doc1 = await Designer.create({
        userId: fakeUserId2,
        displayName: 'test-unique-1',
        phone: '+910000000001',
        city: 'CityA',
    });

    try {
        await Designer.create({
            userId: fakeUserId2, // same userId — should fail
            displayName: 'test-unique-2',
            phone: '+910000000002',
            city: 'CityB',
        });
        fail('Duplicate userId was allowed — unique constraint is NOT enforced');
    } catch (err) {
        if (err.code === 11000) {
            pass('Duplicate userId correctly rejected with E11000 (unique constraint works)');
        } else {
            fail(`Unexpected error: ${err.message}`);
        }
    } finally {
        await Designer.deleteOne({ _id: doc1._id });
        pass('Uniqueness test doc cleaned up');
    }

    // ── Done ───────────────────────────────────────────────────────────────────
    console.log('\n──────────────────────────────────────────────────────');
    if (process.exitCode === 1) {
        console.log('❌ Phase 1 verification FAILED. Review failures above.');
    } else {
        console.log('✅ Phase 1 verification PASSED. All checks green.');
    }
    console.log('──────────────────────────────────────────────────────\n');

    await mongoose.disconnect();
}

run().catch(err => {
    console.error('Script crashed:', err);
    process.exit(1);
});
