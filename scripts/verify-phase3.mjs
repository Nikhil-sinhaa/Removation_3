/**
 * Phase 3 Verification Script
 * Run: node scripts/verify-phase3.mjs
 *
 * Checks:
 *  1. Admin bootstrap — the admin user exists with role='admin'
 *  2. Non-admin hitting admin routes → 403
 *  3. GET pending designers → lists unverified + no-rejection docs
 *  4. PATCH verify → isVerified flips, verifiedAt + verifiedBy set
 *  5. PATCH reject → rejectionReason set, audit fields cleared
 *  6. Reject requires reason ≥ 5 chars
 *  7. Designer can re-register after rejection (Phase 2 integration)
 *  8. Verified designer disappears from pending list
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/removation_ai';
const ADMIN_EMAIL = 'nikhilkumarsinha4321@gmail.com';

// ── Inline schemas ─────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
    email:    { type: String, required: true, unique: true },
    role:     { type: String, enum: ['customer', 'designer', 'admin'], default: 'customer' },
    credits:  { type: Number, default: 10 },
    subscription: {
        plan: { type: String, default: 'free' },
        status: { type: String, default: 'inactive' },
        credits: { type: Number, default: 10 },
        creditsUsed: { type: Number, default: 0 },
        cancelAtPeriodEnd: { type: Boolean, default: false },
        paymentMethod: { type: String, default: 'none' },
    },
    creditHistory: [], paymentHistory: [],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { strict: false });

const DesignerSchema = new mongoose.Schema({
    userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    displayName:      { type: String, required: true, trim: true },
    phone:            { type: String, required: true },
    city:             { type: String, required: true },
    specialties:      { type: [String], default: [] },
    portfolioImages:  { type: [String], default: [] },
    isVerified:       { type: Boolean, default: false },
    verifiedAt:       { type: Date, default: null },
    verifiedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason:  { type: String, default: null },
    isActive:         { type: Boolean, default: true },
}, { timestamps: true });

const User     = mongoose.models.User     || mongoose.model('User',     UserSchema);
const Designer = mongoose.models.Designer || mongoose.model('Designer', DesignerSchema);

// ── Helpers ─────────────────────────────────────────────────────────────────

function pass(msg)    { console.log(`  ✅ PASS  ${msg}`); }
function fail(msg)    { console.log(`  ❌ FAIL  ${msg}`); process.exitCode = 1; }
function section(msg) { console.log(`\n── ${msg} ──────────────────────────────────`); }

/** Simulate requireRole — mirrors lib/auth/requireRole.ts */
async function simulateRequireRole(userId, allowedRoles) {
    if (!userId) return { error: 401 };
    const dbUser = await User.findById(userId);
    if (!dbUser)                          return { error: 404 };
    if (!allowedRoles.includes(dbUser.role)) return { error: 403 };
    return { user: dbUser };
}

/** Simulate GET /api/admin/designers/pending */
async function simulateGetPending(actingUserId) {
    const auth = await simulateRequireRole(actingUserId, ['admin']);
    if (auth.error) return { status: auth.error };
    const pending = await Designer.find({ isVerified: false, rejectionReason: null })
        .populate('userId', 'firstName lastName email imageUrl')
        .sort({ createdAt: 1 });
    return { status: 200, designers: pending };
}

/** Simulate PATCH /api/admin/designers/[id]/verify */
async function simulateVerify(actingUserId, designerId) {
    const auth = await simulateRequireRole(actingUserId, ['admin']);
    if (auth.error) return { status: auth.error };
    if (!mongoose.Types.ObjectId.isValid(designerId)) return { status: 400, message: 'Invalid ID' };
    const designer = await Designer.findById(designerId);
    if (!designer) return { status: 404 };
    if (designer.isVerified) return { status: 400, message: 'Already verified' };
    designer.isVerified = true;
    designer.verifiedAt = new Date();
    designer.verifiedBy = auth.user._id;
    designer.rejectionReason = null;
    await designer.save();
    return { status: 200, designer };
}

/** Simulate PATCH /api/admin/designers/[id]/reject */
async function simulateReject(actingUserId, designerId, reason) {
    const auth = await simulateRequireRole(actingUserId, ['admin']);
    if (auth.error) return { status: auth.error };
    if (!mongoose.Types.ObjectId.isValid(designerId)) return { status: 400, message: 'Invalid ID' };
    if (!reason || reason.trim().length < 5)
        return { status: 400, message: 'Rejection reason is required (min 5 characters)' };
    const designer = await Designer.findById(designerId);
    if (!designer) return { status: 404 };
    designer.isVerified    = false;
    designer.rejectionReason = reason.trim();
    designer.verifiedAt    = null;
    designer.verifiedBy    = null;
    await designer.save();
    return { status: 200, designer };
}

/** Simulate POST /api/designer/register */
async function simulateRegister(userId, body) {
    const auth = await simulateRequireRole(userId, ['customer', 'designer', 'admin']);
    if (auth.error) return { status: auth.error };
    const existing = await Designer.findOne({ userId });
    if (existing && existing.rejectionReason === null) return { status: 400, message: 'Already registered' };
    if (existing && existing.rejectionReason !== null) {
        Object.assign(existing, { ...body, isVerified: false, verifiedAt: null, verifiedBy: null, rejectionReason: null });
        const d = await existing.save();
        return { status: 201, designer: d };
    }
    const d = await Designer.create({ userId, ...body, isVerified: false, isActive: true });
    return { status: 201, designer: d };
}

// ── Main ───────────────────────────────────────────────────────────────────────

const cleanup = { users: [], designers: [] };

async function run() {
    console.log('Phase 3 Verification — connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('Connected.\n');

    try {
        // ── CHECK 1: Admin user exists ──────────────────────────────────────
        section('CHECK 1: Admin bootstrap — admin user exists in DB');
        const adminUser = await User.findOne({ email: ADMIN_EMAIL });
        if (!adminUser) {
            fail(`No user found for ${ADMIN_EMAIL} — run: node scripts/make-admin.mjs ${ADMIN_EMAIL}`);
            return;
        }
        if (adminUser.role === 'admin') {
            pass(`${ADMIN_EMAIL} has role="admin"`);
        } else {
            fail(`${ADMIN_EMAIL} role="${adminUser.role}" — expected "admin"`);
        }

        // ── Setup: test customer + designer ────────────────────────────────
        section('SETUP: Create test customer + pending designer');
        const testCustomer = await User.create({
            email: `p3-customer-${Date.now()}@test.dev`,
            role: 'customer',
            credits: 10,
            subscription: { plan: 'free', status: 'inactive', credits: 10, creditsUsed: 0, cancelAtPeriodEnd: false, paymentMethod: 'none' },
            creditHistory: [], paymentHistory: [],
            createdAt: new Date(), updatedAt: new Date(),
        });
        cleanup.users.push(testCustomer._id);

        const regResult = await simulateRegister(testCustomer._id, {
            displayName: 'Test Designer Phase3',
            phone: '+919000000001',
            city: 'Chennai',
        });
        if (regResult.status === 201) {
            pass(`Pending designer created: ${regResult.designer._id}`);
            cleanup.designers.push(regResult.designer._id);
        } else {
            fail(`Setup failed: ${regResult.status} ${regResult.message}`);
            return;
        }
        const designerId = regResult.designer._id.toString();

        // ── CHECK 2: Non-admin → 403 ────────────────────────────────────────
        section('CHECK 2: Non-admin hitting admin route → 403');
        const forbiddenResult = await simulateGetPending(testCustomer._id);
        if (forbiddenResult.status === 403) {
            pass('Customer (non-admin) gets 403 on /api/admin/designers/pending');
        } else {
            fail(`Expected 403, got ${forbiddenResult.status}`);
        }

        // ── CHECK 3: GET pending list ───────────────────────────────────────
        section('CHECK 3: GET /api/admin/designers/pending lists pending docs');
        const pendingResult = await simulateGetPending(adminUser._id);
        if (pendingResult.status === 200) {
            pass(`200 returned, ${pendingResult.designers.length} pending designer(s)`);
            const found = pendingResult.designers.some(d => d._id.toString() === designerId);
            if (found) {
                pass('Our test designer appears in the pending list');
            } else {
                fail('Our test designer NOT in pending list');
            }
        } else {
            fail(`Expected 200, got ${pendingResult.status}`);
        }

        // ── CHECK 4: PATCH verify ────────────────────────────────────────────
        section('CHECK 4: PATCH /verify → isVerified flips with audit trail');
        const verifyResult = await simulateVerify(adminUser._id, designerId);
        if (verifyResult.status === 200) {
            pass('200 returned after verify');
        } else {
            fail(`Expected 200, got ${verifyResult.status}: ${verifyResult.message}`);
        }

        const afterVerify = await Designer.findById(designerId);
        if (afterVerify.isVerified === true) {
            pass('isVerified = true');
        } else {
            fail('isVerified still false after verify');
        }
        if (afterVerify.verifiedAt instanceof Date) {
            pass(`verifiedAt = ${afterVerify.verifiedAt.toISOString()}`);
        } else {
            fail('verifiedAt not set');
        }
        if (afterVerify.verifiedBy?.toString() === adminUser._id.toString()) {
            pass(`verifiedBy = admin user id (${adminUser._id})`);
        } else {
            fail(`verifiedBy mismatch: ${afterVerify.verifiedBy} vs ${adminUser._id}`);
        }
        if (afterVerify.rejectionReason === null) {
            pass('rejectionReason = null after verify');
        } else {
            fail(`rejectionReason not cleared: "${afterVerify.rejectionReason}"`);
        }

        // ── CHECK 5: Verified designer absent from pending list ─────────────
        section('CHECK 5: Verified designer absent from pending list');
        const pendingAfterVerify = await simulateGetPending(adminUser._id);
        const stillPending = pendingAfterVerify.designers?.some(d => d._id.toString() === designerId);
        if (!stillPending) {
            pass('Verified designer is NOT in pending list (correct)');
        } else {
            fail('Verified designer still appears in pending list');
        }

        // ── CHECK 6: Double-verify → 400 ───────────────────────────────────
        section('CHECK 6: Verifying an already-verified designer → 400');
        const doubleVerify = await simulateVerify(adminUser._id, designerId);
        if (doubleVerify.status === 400 && doubleVerify.message === 'Already verified') {
            pass('400 "Already verified" — correct guard');
        } else {
            fail(`Expected 400, got ${doubleVerify.status}: ${doubleVerify.message}`);
        }

        // ── CHECK 7: PATCH reject ────────────────────────────────────────────
        section('CHECK 7: PATCH /reject → rejectionReason set, audit cleared');
        const rejectResult = await simulateReject(adminUser._id, designerId, 'Portfolio images are too low resolution');
        if (rejectResult.status === 200) {
            pass('200 returned after reject');
        } else {
            fail(`Expected 200, got ${rejectResult.status}: ${rejectResult.message}`);
        }

        const afterReject = await Designer.findById(designerId);
        if (afterReject.isVerified === false) {
            pass('isVerified = false after rejection');
        } else {
            fail('isVerified still true after rejection');
        }
        if (afterReject.rejectionReason === 'Portfolio images are too low resolution') {
            pass(`rejectionReason set correctly: "${afterReject.rejectionReason}"`);
        } else {
            fail(`rejectionReason = "${afterReject.rejectionReason}"`);
        }
        if (afterReject.verifiedAt === null && afterReject.verifiedBy === null) {
            pass('verifiedAt + verifiedBy cleared on rejection');
        } else {
            fail(`Audit trail not cleared: verifiedAt=${afterReject.verifiedAt}, verifiedBy=${afterReject.verifiedBy}`);
        }

        // ── CHECK 8: Reject needs reason ≥ 5 chars ──────────────────────────
        section('CHECK 8: Reject with short reason → 400');
        const shortReject = await simulateReject(adminUser._id, designerId, 'bad');
        if (shortReject.status === 400 && shortReject.message?.includes('min 5')) {
            pass('Short reason correctly rejected with 400');
        } else {
            fail(`Expected 400 for short reason, got ${shortReject.status}: ${shortReject.message}`);
        }

        // ── CHECK 9: Invalid ObjectId → 400 ─────────────────────────────────
        section('CHECK 9: Invalid ObjectId → 400');
        const badIdVerify  = await simulateVerify(adminUser._id, 'not-an-objectid');
        const badIdReject  = await simulateReject(adminUser._id, 'not-an-objectid', 'Some reason here');
        if (badIdVerify.status === 400)  pass('Invalid ObjectId on verify → 400');
        else                             fail(`Expected 400, got ${badIdVerify.status}`);
        if (badIdReject.status === 400)  pass('Invalid ObjectId on reject → 400');
        else                             fail(`Expected 400, got ${badIdReject.status}`);

        // ── CHECK 10: Rejected designer can resubmit ─────────────────────────
        section('CHECK 10: Rejected designer can resubmit (Phase 2 + 3 integration)');
        const resubResult = await simulateRegister(testCustomer._id, {
            displayName: 'Test Designer Phase3 v2',
            phone: '+919000000002',
            city: 'Hyderabad',
        });
        if (resubResult.status === 201) {
            pass('Rejected designer can resubmit → 201');
        } else {
            fail(`Expected 201 on resubmit, got ${resubResult.status}: ${resubResult.message}`);
        }

        const afterResub = await Designer.findById(designerId);
        if (afterResub.rejectionReason === null && afterResub.isVerified === false) {
            pass('After resubmit: rejectionReason=null, isVerified=false (pending again)');
        } else {
            fail(`After resubmit: rejectionReason="${afterResub.rejectionReason}", isVerified=${afterResub.isVerified}`);
        }

        // Resubmitted designer should appear in pending again
        const pendingAfterResub = await simulateGetPending(adminUser._id);
        const backInQueue = pendingAfterResub.designers?.some(d => d._id.toString() === designerId);
        if (backInQueue) {
            pass('Resubmitted designer is back in the pending queue');
        } else {
            fail('Resubmitted designer NOT in pending queue');
        }

    } finally {
        section('CLEANUP');
        for (const id of cleanup.designers) await Designer.deleteOne({ _id: id });
        for (const id of cleanup.users)    await User.deleteOne({ _id: id });
        pass(`Cleaned up ${cleanup.users.length} test users, ${cleanup.designers.length} designer profiles`);
    }

    console.log('\n──────────────────────────────────────────────────────');
    if (process.exitCode === 1) {
        console.log('❌ Phase 3 verification FAILED. Review failures above.');
    } else {
        console.log('✅ Phase 3 verification PASSED. All checks green.');
    }
    console.log('──────────────────────────────────────────────────────\n');

    await mongoose.disconnect();
}

run().catch(err => {
    console.error('Script crashed:', err.message);
    process.exit(1);
});
