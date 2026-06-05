import mongoose from 'mongoose';

const AppSettingsSchema = new mongoose.Schema({
  key:       { type: String, required: true, unique: true },
  value:     { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.AppSettings ||
  mongoose.model('AppSettings', AppSettingsSchema);
