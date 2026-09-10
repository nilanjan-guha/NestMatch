import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPGProperty extends Document {
  owner_id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  gender_type: 'Male' | 'Female' | 'Unisex';
  pricing: {
    monthly_rent: number;
    security_deposit: number;
  };
  amenities: string[];
  rules: string[];
  media: string[];
  capacity: {
    total_beds: number;
    available_beds: number;
    room_details: string;
  };
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const PGPropertySchema: Schema = new Schema({
  owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip_code: { type: String, required: true },
    coordinates: { 
      type: [Number], 
      required: true,
      index: '2dsphere' // Essential for Geo-spatial queries (finding PGs near a location)
    }
  },
  gender_type: { 
    type: String, 
    enum: ['Male', 'Female', 'Unisex'], 
    required: true 
  },
  pricing: {
    monthly_rent: { type: Number, required: true },
    security_deposit: { type: Number, required: true }
  },
  amenities: [{ type: String }],
  rules: [{ type: String }],
  media: [{ type: String }],
  capacity: {
    total_beds: { type: Number, default: 0 },
    available_beds: { type: Number, default: 0 },
    room_details: { type: String, default: '' }
  },
  rating: { type: Number, default: 0 }
}, {
  timestamps: true
});

export const PGProperty: Model<IPGProperty> = mongoose.models.PGProperty || mongoose.model<IPGProperty>('PGProperty', PGPropertySchema);
