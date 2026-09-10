import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  location?: string;
  coordinates?: [number, number]; // [longitude, latitude]
  role: 'searcher' | 'owner' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: false },
  location: { type: String, required: false },
  coordinates: { type: [Number], required: false }, // [longitude, latitude]
  role: { type: String, enum: ['searcher', 'owner', 'admin'], default: 'searcher' },
}, {
  timestamps: true 
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
