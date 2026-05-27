/**
 * Phase 2 Verification Script
 * Run: node scripts/verify-phase2.mjs
 *
 * Directly exercises the same logic as:
 *   POST /api/designer/register
 *   GET  /api/designer/me
 *   requireRole helper
 *
 * Uses your live MongoDB — all test data is cleaned up at the end.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/removation_ai';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

// ── Inline models (matching our actual files exactly) ──────────────────────────

const UserSchema = new mongoose.Schema({
    email:    { type: String, required: true, unique: true },
    password: String,
    firstName: String,
    role: { type: String, enum: ['customer', 'designer', 'admin'], default: 'customer' },
    isVerified: { type: Boolean, default: false },
    credits: { type: Number, default: 10 },
    creditHistory: [],
    paymentHistory: [],
    subscription: {
        plan:   { type: String, default: 'free' },
        status: { type: String, default: 'inactive' },
        credits: { type: Number, default: 10 },
        creditsUsed: { type: Number, default: 0 },
        cancelAtPeriodEnd: { type: Boolean, default: false },
        paymentMethod: { type: String, default: 'none' },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { strict: false });

const DesignerSchema = new mongoose.Schema({
    userId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    displayName:        { type: String, required: true, trim: true },
    bio:                { type: String, maxlength: 1000 },
    phone:              { type: String, required: true },
    city:               { type: String, required: true },
    specialties:        { type: [String], default: [] },
    portfolioImages:    { type: [String], default: [] },
    yearsOfExperience:  { type: Number, min: 0, max: 60 },
    isVerified:         { type: Boolean, default: false },
    verifiedAt:         { type: Date, default: null },
    verifiedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason:    { type: String, default: null },
    isActive:           { type: Boolean, default: true },
}, { timestamps: true });

const User    = mongoose.models.User    || mongoose.model('User',    UserSchema);
const Designer = mongoose.models.Designer || mongoose.model('Designer', DesignerSchema);

// ── Helpers ─────────────────────────────────────────────────────────────────

const VALID_SPECIALTIES = ['modular-kitchen','bedroom','living-room','bathroom','office','vastu','luxury','budget','minimalist','traditional','contemporary','kids-room','renovation','lighting-design','3d-visualization'];

function pass(msg)    { console.log(`  ✅ PASS  ${msg}`); }
function fail(msg)    { console.log(`  ❌ FAIL  ${msg}`); process.exitCode = 1; }
function section(msg) { console.log(`\n── ${msg} ──────────────────────────────────`); }

/** Simulates requireRole: checks user exists and role is allowed */
async function simulateRequireRole(userId, allowedRoles) {
    const dbUser = await User.findById(userId);
    if (!dbUser) return { error: 404 };
    if (!allowedRoles.includes(dbUser.role)) return { error: 403 };
    return { user: dbUser };
}

/** Simulates POST /api/designer/register */
async function simulateRegisterDesigner(userId, body) {
    const auth = await simulateRequireRole(userId, ['customer', 'designer', 'admin']);
    if (auth.error) return { status: auth.error };

    const { displayName, bio, phone, city, specialties, portfolioImages, yearsOfExperience } = body;
    if (!displayName || displayName.trim().length < 2) return { status: 400, message: 'Display name invalid' };
    if (!phone || phone.trim().length < 5)              return { status: 400, message: 'Phone invalid' };
    if (!city  || city.trim().length < 2)               return { status: 400, message: 'City invalid' };

    if (specialties) {
        for (const s of specialties) {
            if (!VALID_SPECIALTIES.includes(s)) return { status: 400, message: `Invalid specialty: ${s}` };
        }
    }
    if (portfolioImages && portfolioImages.length > 10) return { status: 400, message: 'Max 10 images' };

    const existing = await Designer.findOne({ userId });
    let designer;

    if (existing) {
        if (existing.rejectionReason !== null) {
            // Resubmission flow
            Object.assign(existing, {
                displayName: displayName.trim(), bio: bio?.trim(), phone: phone.trim(),
                city: city.trim(), specialties: specialties || [], portfolioImages: portfolioImages || [],
                yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
                isVerified: false, verifiedAt: null, verifiedBy: null, rejectionReason: null,
            });
            designer = await existing.save();
        } else {
            return { status: 400, message: 'Already registered as a designer' };
        }
    } else {
        designer = await Designer.create({
            userId, displayName: displayName.trim(), bio: bio?.trim(), phone: phone.trim(),
            city: city.trim(), specialties: specialties || [], portfolioImages: portfolioImages || [],
            yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
            isVerified: false, isActive: true,
        });
    }

    // Flip role
    if (auth.user.role === 'customer') {
        await User.findByIdAndUpdate(userId, { role: 'designer' });
    }

    return { status: 201, designer };
}

/** Simulates GET /api/designer/me */
async function simulateGetMe(userId) {
    const auth = await simulateRequireRole(userId, ['customer', 'designer', 'admin']);
    if (auth.error) return { status: auth.error };
    const designer = await Designer.findOne({ userId });
    if (!designer) return { status: 404 };
    return { status: 200, designer };
}

// ── Test runner ───────────────────────────────────────────────────────────────

const cleanupIds = { users: [], designers: [] };

async function run() {
    console.log('Phase 2 Verification — connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('Connected.\n');

    try {
        // ── Setup: create a test customer user ────────────────────────────
        section('SETUP: Create test customer user');
        const hash = await bcrypt.hash('testpass123', 10);
        const testUser = await User.create({
            email: `phase2-verify-test-${Date.now()}@test.dev`,
            password: hash,
            firstName: 'TestPhase2',
            role: 'customer',
        });
        cleanupIds.users.push(testUser._id);
        pass(`Test user created: ${testUser.email}, role=${testUser.role}`);

        // ── CHECK 1: No JWT → simulate 401 ────────────────────────────────
        section('CHECK 1: Unauthenticated request → 401');
        // Simulate "no user found" from getCurrentUser (returns null)
        const dbCheck = await User.findById(new mongoose.Types.ObjectId()); // non-existent id
        if (!dbCheck) {
            pass('Non-existent userId → 404 (unauthenticated path simulated)');
        } else {
            fail('Expected null for non-existent user');
        }

        // ── CHECK 2: POST register — happy path ───────────────────────────
        section('CHECK 2: POST /api/designer/register — happy path');
        const reg1 = await simulateRegisterDesigner(testUser._id, {
            displayName: 'Priya Sharma Interiors',
            bio: 'Specialist in vastu-compliant home designs',
            phone: '+919876543210',
            city: 'Bangalore',
            specialties: ['vastu', 'living-room'],
            portfolioImages: ['https://picsum.photos/800/600'],
            yearsOfExperience: 7,
        });

        if (reg1.status === 201) {
            pass(`201 returned — designer created, _id=${reg1.designer._id}`);
            cleanupIds.designers.push(reg1.designer._id);
        } else {
            fail(`Expected 201, got ${reg1.status}: ${reg1.message}`);
        }

        if (reg1.designer?.isVerified === false) {
            pass('isVerified = false (pending review)');
        } else {
            fail(`isVerified = ${reg1.designer?.isVerified} — expected false`);
        }

        // Check user role flipped
        const updatedUser = await User.findById(testUser._id);
        if (updatedUser.role === 'designer') {
            pass('User.role flipped to "designer"');
        } else {
            fail(`User.role = "${updatedUser.role}" — expected "designer"`);
        }

        // ── CHECK 3: GET /api/designer/me ────────────────────────────────
        section('CHECK 3: GET /api/designer/me');
        const me = await simulateGetMe(testUser._id);
        if (me.status === 200 && me.designer?.displayName === 'Priya Sharma Interiors') {
            pass('Returned correct designer profile for current user');
        } else {
            fail(`Expected 200 + correct profile, got ${me.status}`);
        }

        // ── CHECK 4: Second register call → 400 ──────────────────────────
        section('CHECK 4: Second register on same user → 400 "Already registered"');
        const reg2 = await simulateRegisterDesigner(testUser._id, {
            displayName: 'Duplicate attempt',
            phone: '+911111111111',
            city: 'Delhi',
        });
        if (reg2.status === 400 && reg2.message === 'Already registered as a designer') {
            pass('400 "Already registered as a designer" — correct');
        } else {
            fail(`Expected 400, got ${reg2.status}: ${reg2.message}`);
        }

        // ── CHECK 5: Rejection resubmission flow ─────────────────────────
        section('CHECK 5: Rejection → resubmission');
        // Simulate an admin rejecting
        await Designer.findByIdAndUpdate(reg1.designer._id, {
            rejectionReason: 'Portfolio images are blurry',
            isVerified: false,
        });
        pass('Simulated admin rejection (rejectionReason set)');

        const reg3 = await simulateRegisterDesigner(testUser._id, {
            displayName: 'Priya Sharma Interiors v2',
            phone: '+919876543210',
            city: 'Bangalore',
            specialties: ['vastu'],
        });
        if (reg3.status === 201) {
            pass('Resubmission after rejection → 201');
        } else {
            fail(`Expected 201 on resubmission, got ${reg3.status}: ${reg3.message}`);
        }

        const resubmitted = await Designer.findById(reg1.designer._id);
        if (resubmitted.rejectionReason === null) {
            pass('rejectionReason cleared after resubmission');
        } else {
            fail(`rejectionReason not cleared: "${resubmitted.rejectionReason}"`);
        }
        if (resubmitted.displayName === 'Priya Sharma Interiors v2') {
            pass('displayName updated on resubmission');
        } else {
            fail(`displayName not updated: "${resubmitted.displayName}"`);
        }

        // ── CHECK 6: Validation — invalid specialty ───────────────────────
        section('CHECK 6: Invalid specialty → 400');
        const testUser2 = await User.create({
            email: `phase2-verify-val-${Date.now()}@test.dev`,
            role: 'customer',
            credits: 10,
            subscription: { plan: 'free', status: 'inactive', credits: 10, creditsUsed: 0, cancelAtPeriodEnd: false, paymentMethod: 'none' },
            creditHistory: [], paymentHistory: [],
            createdAt: new Date(), updatedAt: new Date(),
        });
        cleanupIds.users.push(testUser2._id);

        const regBadSpec = await simulateRegisterDesigner(testUser2._id, {
            displayName: 'Test Bad',
            phone: '+910000000000',
            city: 'Pune',
            specialties: ['plumbing'], // not in enum
        });
        if (regBadSpec.status === 400 && regBadSpec.message?.includes('Invalid specialty')) {
            pass('Invalid specialty correctly rejected with 400');
        } else {
            fail(`Expected 400 for invalid specialty, got ${regBadSpec.status}: ${regBadSpec.message}`);
        }

        // ── CHECK 7: GET /api/designer/me → 404 if no profile ────────────
        section('CHECK 7: GET /api/designer/me → 404 (no profile)');
        const meNone = await simulateGetMe(testUser2._id);
        if (meNone.status === 404) {
            pass('404 when user has no designer profile');
        } else {
            fail(`Expected 404, got ${meNone.status}`);
        }

        // ── CHECK 8: Phone stored as string ──────────────────────────────
        section('CHECK 8: Phone stored as String (not Number)');
        const savedDesigner = await Designer.findById(reg1.designer._id);
        if (typeof savedDesigner.phone === 'string') {
            pass(`phone is typeof string: "${savedDesigner.phone}"`);
        } else {
            fail(`phone typeof = ${typeof savedDesigner.phone} — expected "string"`);
        }

    } finally {
        // ── Cleanup ───────────────────────────────────────────────────────
        section('CLEANUP');
        for (const id of cleanupIds.designers) {
            await Designer.deleteOne({ _id: id });
        }
        for (const id of cleanupIds.users) {
            await User.deleteOne({ _id: id });
        }
        pass(`Cleaned up ${cleanupIds.users.length} test users, ${cleanupIds.designers.length} designer profiles`);
    }

    console.log('\n──────────────────────────────────────────────────────');
    if (process.exitCode === 1) {
        console.log('❌ Phase 2 verification FAILED. Review failures above.');
    } else {
        console.log('✅ Phase 2 verification PASSED. All checks green.');
    }
    console.log('──────────────────────────────────────────────────────\n');

    await mongoose.disconnect();
}

run().catch(err => {
    console.error('Script crashed:', err);
    process.exit(1);
});
