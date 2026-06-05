import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/removation_ai';

async function main() {
    await mongoose.connect(MONGODB_URI);
    
    // Hash password123
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Update passwords of all test users
    const emails = [
        'nikhilkumarsinha4321@gmail.com',
        'testuser1@example.com',
        'ni329611b@gmail.com',
        'xhm90760@gmail.com'
    ];
    
    for (const email of emails) {
        const res = await mongoose.connection.db.collection('users').updateOne(
            { email },
            { $set: { password: hashedPassword } }
        );
        console.log(`Updated user ${email} password status:`, res.modifiedCount);
    }
    
    // Transition pending booking to confirmed for ni329611b@gmail.com (Removation interior)
    // Designer is 6a171b68ce9ba93eb703099a
    const bookingRes = await mongoose.connection.db.collection('bookings').updateOne(
        { _id: new mongoose.Types.ObjectId('6a17e45ce652e00435cf1f59') },
        { $set: { status: 'confirmed' } }
    );
    console.log('Updated booking 6a17e45ce652e00435cf1f59 to confirmed status:', bookingRes.modifiedCount);

    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
