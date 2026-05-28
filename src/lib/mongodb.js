// NOTE: This connector is kept for src/lib/appSettings.js only.
// All other files should use lib/db/mongodb.ts via connectDB export.
// Do not add new imports of this file.
import mongoose from 'mongoose'
const MONGODB_URI = 'mongodb://127.0.0.1:27017/removation_ai'
let cached = global.mongoose
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}
export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn
  }
  if (cached.promise && mongoose.connection.readyState === 0) {
    cached.promise = null
    cached.conn = null
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    }).catch(err => {
      cached.promise = null
      throw err
    })
  }
  cached.conn = await cached.promise
  return cached.conn
}
