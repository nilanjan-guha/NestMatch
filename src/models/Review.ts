import mongoose, { Schema, model, models } from 'mongoose';

const ReviewSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  property_id: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true },
}, {
  timestamps: true
});

// A user can only review a property once
ReviewSchema.index({ user_id: 1, property_id: 1 }, { unique: true });

if (mongoose.models.Review) {
  delete mongoose.models.Review;
}
export const Review = model('Review', ReviewSchema);
