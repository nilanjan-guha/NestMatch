import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOwner extends Document {
  name: string;
  email: string;
  phone: string;
  verification_status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OwnerSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  verification_status: { type: Boolean, default: false }
}, {
  timestamps: true 
});

export const Owner: Model<IOwner> = mongoose.models.Owner || mongoose.model<IOwner>('Owner', OwnerSchema);
