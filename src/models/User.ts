import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  clerkId?: string; // Add clerkId for Clerk integration
  name: string;
  email: string;
  password?: string;
  phone?: string;
  location?: string;
  coordinates?: [number, number]; // [longitude, latitude]
  role: 'searcher' | 'owner' | 'admin';
  onboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  clerkId: { type: String, unique: true, sparse: true }, // Add clerkId
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Make password optional for Google logins
  phone: { type: String, required: false },
  location: { type: String, required: false },
  coordinates: { type: [Number], required: false }, // [longitude, latitude]
  role: { type: String, enum: ['searcher', 'owner', 'admin'], default: 'searcher' },
  onboarded: { type: Boolean, default: false },
}, {
  timestamps: true 
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
