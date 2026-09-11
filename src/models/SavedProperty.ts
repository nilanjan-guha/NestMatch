import mongoose, { Schema, model, models } from 'mongoose';

const SavedPropertySchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  property_id: { type: String, required: true },
  property_data: { type: Schema.Types.Mixed, default: null } // Cache external data here
}, {
  timestamps: true
});

// Ensure a user can only save a specific property once
SavedPropertySchema.index({ user_id: 1, property_id: 1 }, { unique: true });

if (mongoose.models.SavedProperty) {
  delete mongoose.models.SavedProperty;
}
export const SavedProperty = model('SavedProperty', SavedPropertySchema);
