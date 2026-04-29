import mongoose, { Schema } from "mongoose";

export const DonorTypes = ["INDIVIDUAL", "ORGANIZATION"] as const;

export interface Donor {
  userId?: mongoose.Types.ObjectId;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  donorType: (typeof DonorTypes)[number];
  totalDonated: number;
  createdAt: Date;
  updatedAt: Date;
}

const donorSchema = new Schema<Donor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", sparse: true, index: true },
    fullName: { type: String, required: true, trim: true, maxlength: 140 },
    phone: { type: String, trim: true, maxlength: 20, sparse: true },
    email: { type: String, trim: true, lowercase: true, maxlength: 200, sparse: true },
    address: { type: String, trim: true, maxlength: 500 },
    donorType: { type: String, enum: DonorTypes, default: "INDIVIDUAL" },
    totalDonated: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

donorSchema.index({ phone: 1 }, { unique: true, sparse: true });
donorSchema.index({ email: 1 }, { unique: true, sparse: true });
donorSchema.index({ fullName: "text", email: "text", phone: "text" });

export const DonorModel = mongoose.model<Donor>("Donor", donorSchema);
