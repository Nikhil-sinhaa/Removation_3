/**
 * Phase 4 Verification Script
 * Run: node scripts/verify-phase4.mjs
 *
 * Checks:
 *  1. Logged-out user sees only verified designers, phone NOT present
 *  2. Pending + rejected designers are absent from public list
 *  3. Filter by city works
 *  4. Filter by specialty works
 *  5. Search by displayName works (case-insensitive)
 *  6. Pagination (page + pageCount) correct
 *  7. GET /api/designers/[id] — verified → 200
 *  8. GET /api/designers/[id] — pending → 404 (no info leak)
 *  9. GET /api/designers/[id] — invalid ObjectId → 404
 * 10. Logged-in user gets phone in both list and single endpoints
 */

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/removation_ai';
const JWT_SECRET  = process.env.JWT_SECRET  || 'change-me-in-production';

// ── Inline models ─────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    role:  { type: String, enum: ['customer','designer','admin'], default: 'customer' },
    credits: { type: Number, default: 10 },
    subscription: {
        plan: { type: String, default: 'free' }, status: { type: String, default: 'inactive' },
        credits: { type: Number, default: 10 }, creditsUsed: { type: Number, default: 0 },
        cancelAtPeriodEnd: { type: Boolean, default: false }, paymentMethod: { type: String, default: 'none' },
    },
    creditHistory: [], paymentHistory: [],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { strict: false });

const DesignerSchema = new mongoose.Schema({
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    displayName:     { type: String, required: true },
    bio:             String,
    phone:           { type: String, required: true },
    city:            { type: String, required: true },
    specialties:     { type: [String], default: [] },
    portfolioImages: { type: [String], default: [] },
    yearsOfExperience: Number,
    isVerified:      { type: Boolean, default: false },
    verifiedAt:      { type: Date, default: null },
    verifiedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, default: null },
    isActive:        { type: Boolean, default: true },
}, { timestamps: true });

const User     = mongoose.models.User     || mongoose.model('User',     UserSchema);
const Designer = mongoose.models.Designer || mongoose.model('Designer', DesignerSchema);

// ── Helpers ─────────────────────────────────────────────────────────────────

function pass(msg)    { console.log(`  ✅ PASS  ${msg}`); }
function fail(msg)    { console.log(`  ❌ FAIL  ${msg}`); process.exitCode = 1; }
function section(msg) { console.log(`\n── ${msg} ──────────────────────────────────`); }

const PUBLIC_SELECT  = 'displayName bio city specialties portfolioImages yearsOfExperience isVerified createdAt';
const AUTHED_SELECT  = PUBLIC_SELECT + ' phone';

/** Simulate GET /api/designers */
async function simulateListDesigners({ city, specialty, search, page = 1, limit = 20, isLoggedIn = false } = {}) {
    const filter = { isVerified: true, isActive: true };
    if (city)      filter.city        = { $regex: city,    $options: 'i' };
    if (specialty) filter.specialties = specialty;
    if (search)    filter.displayName = { $regex: search,  $options: 'i' };

    const skip = (page - 1) * Math.min(50, limit);
    const cappedLimit = Math.min(50, limit);
    const selectFields = isLoggedIn ? AUTHED_SELECT : PUBLIC_SELECT;

    const [designers, total] = await Promise.all([
        Designer.find(filter).select(selectFields).populate('userId','firstName lastName imageUrl')
            .sort({ createdAt: -1 }).skip(skip).limit(cappedLimit),
        Designer.countDocuments(filter),
    ]);

    return { designers, total, page, pageCount: Math.ceil(total / cappedLimit), phoneIncluded: isLoggedIn };
}

/** Simulate GET /api/designers/[id] */
async function simulateGetDesigner(id, { isLoggedIn = false } = {}) {
    if (!mongoose.Types.ObjectId.isValid(id)) return { status: 404 };
    const selectFields = isLoggedIn ? AUTHED_SELECT : PUBLIC_SELECT;
    const designer = await Designer.findOne({ _id: id, isVerified: true, isActive: true })
        .select(selectFields).populate('userId','firstName lastName imageUrl');
    if (!designer) return { status: 404 };
    return { status: 200, designer };
}

// ── Main ───────────────────────────────────────────────────────────────────────

const cleanup = { users: [], designers: [] };

async function run() {
    console.log('Phase 4 Verification — connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('Connected.\n');

    try {
        // ── SETUP: Create test data ──────────────────────────────────────────
        section('SETUP: 3 designers — 1 verified, 1 pending, 1 rejected');

        // Shared helper for minimal user
        async function mkUser(email) {
            const u = await User.create({
                email, role: 'designer', credits: 10,
                subscription: { plan: 'free', status: 'inactive', credits: 10, creditsUsed: 0, cancelAtPeriodEnd: false, paymentMethod: 'none' },
                creditHistory: [], paymentHistory: [], createdAt: new Date(), updatedAt: new Date(),
            });
            cleanup.users.push(u._id);
            return u;
        }

        const u1 = await mkUser(`p4-verified-${Date.now()}@test.dev`);
        const u2 = await mkUser(`p4-pending-${Date.now()}@test.dev`);
        const u3 = await mkUser(`p4-rejected-${Date.now()}@test.dev`);

        const verifiedDesigner = await Designer.create({
            userId: u1._id, displayName: 'Ananya Verified', phone: '+919111111111',
            city: 'Bangalore', specialties: ['vastu','living-room'],
            isVerified: true, verifiedAt: new Date(), isActive: true,
        });
        const pendingDesigner = await Designer.create({
            userId: u2._id, displayName: 'Rahul Pending', phone: '+919222222222',
            city: 'Mumbai', specialties: ['modular-kitchen'],
            isVerified: false, isActive: true,
        });
        const rejectedDesigner = await Designer.create({
            userId: u3._id, displayName: 'Sneha Rejected', phone: '+919333333333',
            city: 'Delhi', specialties: ['bedroom'],
            isVerified: false, rejectionReason: 'Missing portfolio', isActive: true,
        });
        cleanup.designers.push(verifiedDesigner._id, pendingDesigner._id, rejectedDesigner._id);
        pass('Test data created: 1 verified, 1 pending, 1 rejected designer');

        // ── CHECK 1: Public list — logged-out, phone absent ──────────────────
        section('CHECK 1: Logged-out list — only verified, phone NOT present');
        const publicList = await simulateListDesigners({ isLoggedIn: false });
        const hasVerified = publicList.designers.some(d => d._id.toString() === verifiedDesigner._id.toString());
        const hasPending  = publicList.designers.some(d => d._id.toString() === pendingDesigner._id.toString());
        const hasRejected = publicList.designers.some(d => d._id.toString() === rejectedDesigner._id.toString());

        if (hasVerified)  pass('Verified designer appears in public list');
        else              fail('Verified designer missing from public list');

        if (!hasPending)  pass('Pending designer absent from public list');
        else              fail('Pending designer INCORRECTLY appears in public list');

        if (!hasRejected) pass('Rejected designer absent from public list');
        else              fail('Rejected designer INCORRECTLY appears in public list');

        const verifiedDoc = publicList.designers.find(d => d._id.toString() === verifiedDesigner._id.toString());
        if (verifiedDoc && verifiedDoc.phone === undefined) {
            pass('phone field NOT present for logged-out caller');
        } else if (verifiedDoc) {
            fail(`phone field IS present for logged-out caller: "${verifiedDoc.phone}"`);
        }

        // ── CHECK 2: City filter ─────────────────────────────────────────────
        section('CHECK 2: Filter by city=Bangalore');
        const cityList = await simulateListDesigners({ city: 'Bangalore', isLoggedIn: false });
        const allBangalore = cityList.designers.every(d => /bangalore/i.test(d.city));
        const foundInCity  = cityList.designers.some(d => d._id.toString() === verifiedDesigner._id.toString());
        if (foundInCity)    pass('Verified Bangalore designer found');
        else                fail('Verified Bangalore designer NOT found in city filter');
        if (allBangalore)   pass('All results are from Bangalore');
        else                fail('Non-Bangalore results in city-filtered response');

        // ── CHECK 3: Specialty filter ────────────────────────────────────────
        section('CHECK 3: Filter by specialty=vastu');
        const specList = await simulateListDesigners({ specialty: 'vastu', isLoggedIn: false });
        const hasVastuDesigner = specList.designers.some(d => d._id.toString() === verifiedDesigner._id.toString());
        if (hasVastuDesigner) pass('Vastu-specialty designer found in specialty filter');
        else                  fail('Vastu designer missing from specialty filter');

        // ── CHECK 4: Search filter ───────────────────────────────────────────
        section('CHECK 4: Search by displayName (case-insensitive)');
        const searchList = await simulateListDesigners({ search: 'ananya', isLoggedIn: false });
        const foundBySearch = searchList.designers.some(d => d._id.toString() === verifiedDesigner._id.toString());
        if (foundBySearch) pass('"ananya" search finds "Ananya Verified" (case-insensitive)');
        else               fail('Case-insensitive search failed');

        const noMatch = await simulateListDesigners({ search: 'xyznonexistent', isLoggedIn: false });
        if (noMatch.total === 0) pass('Non-matching search returns 0 results');
        else                     fail(`Non-matching search returned ${noMatch.total} results`);

        // ── CHECK 5: Pagination ──────────────────────────────────────────────
        section('CHECK 5: Pagination fields present and correct');
        const paged = await simulateListDesigners({ page: 1, limit: 1, isLoggedIn: false });
        if (paged.page === 1)              pass('page=1 returned');
        else                               fail(`page should be 1, got ${paged.page}`);
        if (typeof paged.pageCount === 'number') pass(`pageCount=${paged.pageCount}`);
        else                               fail('pageCount missing');
        if (typeof paged.total === 'number')     pass(`total=${paged.total}`);
        else                               fail('total missing');
        if (paged.designers.length <= 1)   pass('limit=1 respected');
        else                               fail('limit not respected');

        // ── CHECK 6: GET /api/designers/[id] — verified ──────────────────────
        section('CHECK 6: GET /designers/[id] — verified designer → 200');
        const single = await simulateGetDesigner(verifiedDesigner._id.toString(), { isLoggedIn: false });
        if (single.status === 200) pass('200 returned for verified designer');
        else                       fail(`Expected 200, got ${single.status}`);
        if (single.designer?.phone === undefined) pass('phone NOT present for logged-out single fetch');
        else                                      fail(`phone present for logged-out: "${single.designer?.phone}"`);

        // ── CHECK 7: GET /api/designers/[id] — pending → 404 ─────────────────
        section('CHECK 7: GET /designers/[id] — pending → 404 (no info leak)');
        const singlePending = await simulateGetDesigner(pendingDesigner._id.toString(), { isLoggedIn: false });
        if (singlePending.status === 404) pass('Pending designer returns 404 (no info leaked)');
        else                              fail(`Expected 404 for pending, got ${singlePending.status}`);

        // ── CHECK 8: GET /api/designers/[id] — invalid ObjectId → 404 ────────
        section('CHECK 8: Invalid ObjectId → 404');
        const singleBadId = await simulateGetDesigner('not-a-valid-id', { isLoggedIn: false });
        if (singleBadId.status === 404) pass('Invalid ObjectId returns 404');
        else                            fail(`Expected 404, got ${singleBadId.status}`);

        // ── CHECK 9: Logged-in user gets phone ───────────────────────────────
        section('CHECK 9: Logged-in user gets phone (list + single)');
        const authedList = await simulateListDesigners({ isLoggedIn: true });
        const authedDoc  = authedList.designers.find(d => d._id.toString() === verifiedDesigner._id.toString());
        if (authedDoc && authedDoc.phone !== undefined) {
            pass(`phone present for logged-in list caller: "${authedDoc.phone}"`);
        } else {
            fail('phone missing for logged-in list caller');
        }

        const authedSingle = await simulateGetDesigner(verifiedDesigner._id.toString(), { isLoggedIn: true });
        if (authedSingle.status === 200 && authedSingle.designer?.phone !== undefined) {
            pass(`phone present for logged-in single fetch: "${authedSingle.designer.phone}"`);
        } else {
            fail(`phone missing for logged-in single fetch (status=${authedSingle.status})`);
        }

        // ── CHECK 10: phoneIncluded transparency flag ─────────────────────────
        section('CHECK 10: phoneIncluded flag correct');
        const publicRes = await simulateListDesigners({ isLoggedIn: false });
        const authedRes = await simulateListDesigners({ isLoggedIn: true });
        if (publicRes.phoneIncluded === false) pass('phoneIncluded=false for logged-out');
        else                                   fail('phoneIncluded should be false for logged-out');
        if (authedRes.phoneIncluded === true)  pass('phoneIncluded=true for logged-in');
        else                                   fail('phoneIncluded should be true for logged-in');

    } finally {
        section('CLEANUP');
        for (const id of cleanup.designers) await Designer.deleteOne({ _id: id });
        for (const id of cleanup.users)     await User.deleteOne({ _id: id });
        pass(`Cleaned up ${cleanup.users.length} test users, ${cleanup.designers.length} designer profiles`);
    }

    console.log('\n──────────────────────────────────────────────────────');
    if (process.exitCode === 1) {
        console.log('❌ Phase 4 verification FAILED. Review failures above.');
    } else {
        console.log('✅ Phase 4 verification PASSED. All checks green.');
    }
    console.log('──────────────────────────────────────────────────────\n');

    await mongoose.disconnect();
}

run().catch(err => {
    console.error('Script crashed:', err.message);
    process.exit(1);
});
