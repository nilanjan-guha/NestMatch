import mongoose, { Schema, model, models } from 'mongoose';

const BookingInterestSchema = new Schema({
  searcher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  property_id: { type: Schema.Types.ObjectId, ref: 'PGProperty', required: true },
  owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: Schema.Types.String, enum: ['Pending', 'Contacted', 'Accepted', 'Rejected'], default: 'Pending' }
}, {
  timestamps: true
});

// Ensure a searcher only expresses interest in a specific property once
BookingInterestSchema.index({ searcher_id: 1, property_id: 1 }, { unique: true });

// Optimize index for owner analytics
BookingInterestSchema.index({ owner_id: 1 });

export const BookingInterest = models.BookingInterest || model('BookingInterest', BookingInterestSchema);
