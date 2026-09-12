import mongoose, { Schema, Document } from 'mongoose';

export interface ISearchAlert extends Document {
  phoneNumber: string;
  query: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
  createdAt: Date;
}

const SearchAlertSchema: Schema = new Schema({
  phoneNumber: { type: String, required: true },
  query: { type: String, required: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.SearchAlert || mongoose.model<ISearchAlert>('SearchAlert', SearchAlertSchema);
