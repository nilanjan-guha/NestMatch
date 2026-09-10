import mongoose, { Schema, model, models } from 'mongoose';

const SavedPropertySchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  property_id: { type: Schema.Types.ObjectId, ref: 'PGProperty', required: true }
}, {
  timestamps: true
});

// Ensure a user can only save a specific property once
SavedPropertySchema.index({ user_id: 1, property_id: 1 }, { unique: true });

export const SavedProperty = models.SavedProperty || model('SavedProperty', SavedPropertySchema);
