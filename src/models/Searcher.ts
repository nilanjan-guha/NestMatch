import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISearcher extends Document {
  name: string;
  email: string;
  phone: string;
  preferences: string; // The saved AI search prompt
  createdAt: Date;
  updatedAt: Date;
}

const SearcherSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false },
  preferences: { type: String, required: false }
}, {
  timestamps: true
});

export const Searcher: Model<ISearcher> = mongoose.models.Searcher || mongoose.model<ISearcher>('Searcher', SearcherSchema);
