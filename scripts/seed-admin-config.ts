import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/removation_ai';

const AdminConfigSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedAt: { type: Date, default: Date.now },
});

const AdminConfig = mongoose.models.AdminConfig || mongoose.model('AdminConfig', AdminConfigSchema);

const DEFAULT_CONFIGS = [
    {
        key: 'app_mode',
        value: 'development'
    },
    {
        key: 'credit_costs',
        value: {
            'room-changer': 1,
            'furniture-remover': 1,
            'redesign': 2
        }
    },
    {
        key: 'free_credits_on_signup',
        value: 10
    }
];

async function main() {
    console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.\n');

    for (const config of DEFAULT_CONFIGS) {
        const res = await AdminConfig.findOneAndUpdate(
            { key: config.key },
            { $setOnInsert: { value: config.value } },
            { upsert: true, new: true }
        );
        console.log(`Config [${config.key}] seeded/checked. Value:`, JSON.stringify(res.value));
    }

    console.log('\nSeeding complete.');
    await mongoose.disconnect();
}

main().catch(err => {
    console.error('Seeding script failed:', err);
    process.exit(1);
});
