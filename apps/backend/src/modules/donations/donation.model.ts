import mongoose, { Schema } from "mongoose";

export type DonationStatus = "pending" | "verified" | "rejected";

export interface Donation {
  donorName: string;
  donorEmail: string;
  amount: number;
  campaignCode: string;
  note?: string;
  status: DonationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const donationSchema = new Schema<Donation>(
  {
    donorName: { type: String, required: true, trim: true, maxlength: 100 },
    donorEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    amount: { type: Number, required: true, min: 1000 },
    campaignCode: { type: String, required: true, trim: true, maxlength: 50 },
    note: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

donationSchema.index({ campaignCode: 1, createdAt: -1 });

export const DonationModel = mongoose.model<Donation>("Donation", donationSchema);
