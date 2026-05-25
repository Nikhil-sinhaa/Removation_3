// lib/db/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || '';

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
    global.mongoose = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongooseInstance) => {
            console.log('✅ MongoDB connected');
            
            // Asynchronously run a quick update to ensure clerkId matches _id for any user missing clerkId
            (async () => {
                try {
                    const User = mongooseInstance.models.User || mongooseInstance.model('User');
                    if (!User) return;

                    // Find users where clerkId is missing or empty
                    const usersToFix = await User.find({
                        $or: [
                            { clerkId: { $exists: false } },
                            { clerkId: null },
                            { clerkId: '' },
                        ]
                    }).select('_id clerkId');

                    if (usersToFix.length === 0) {
                        console.log(`[Auth Migration] Fixed clerkId for 0 users`);
                        return;
                    }

                    // Bulk update — set clerkId = _id.toString()
                    const bulkOps = usersToFix.map(user => ({
                        updateOne: {
                            filter: { _id: user._id },
                            update: { $set: { clerkId: user._id.toString() } },
                        }
                    }));

                    await User.bulkWrite(bulkOps);
                    console.log(`[Auth Migration] Fixed clerkId for ${usersToFix.length} users`);
                } catch (err: any) {
                    // Non-fatal — log and continue
                    console.error('[Auth Migration] Error:', err.message);
                }
            })();
            
            return mongooseInstance;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default connectToDatabase;
