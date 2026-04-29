import mongoose, { Schema } from "mongoose";

export const PaymentStatuses = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"] as const;

interface DonorSnapshot {
  fullName: string;
  phone?: string;
  email?: string;
}

interface CampaignSnapshot {
  code: string;
  title: string;
}

export interface Donation {
  branchId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  donorId: mongoose.Types.ObjectId;
  donorSnapshot: DonorSnapshot;
  campaignSnapshot: CampaignSnapshot;
  amount: number;
  paymentMethod: string;
  paymentStatus: (typeof PaymentStatuses)[number];
  message?: string;
  donatedAt: Date;
  transactionCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const donorSnapshotSchema = new Schema<DonorSnapshot>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 140 },
    phone: { type: String, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200 }
  },
  { _id: false }
);

const campaignSnapshotSchema = new Schema<CampaignSnapshot>(
  {
    code: { type: String, required: true, trim: true, maxlength: 50 },
    title: { type: String, required: true, trim: true, maxlength: 160 }
  },
  { _id: false }
);

const donationSchema = new Schema<Donation>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    donorId: { type: Schema.Types.ObjectId, ref: "Donor", required: true, index: true },
    donorSnapshot: { type: donorSnapshotSchema, required: true },
    campaignSnapshot: { type: campaignSnapshotSchema, required: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, required: true, trim: true, maxlength: 40 },
    paymentStatus: { type: String, enum: PaymentStatuses, default: "PENDING", index: true },
    message: { type: String, trim: true, maxlength: 1000 },
    donatedAt: { type: Date, required: true, default: Date.now, index: true },
    transactionCode: { type: String, required: true, trim: true, maxlength: 100, unique: true, index: true }
  },
  { timestamps: true }
);

donationSchema.index({ branchId: 1, campaignId: 1, donatedAt: -1 });
donationSchema.index({ donorId: 1, donatedAt: -1 });
donationSchema.index({ campaignId: 1, paymentStatus: 1, donatedAt: -1 });

export const DonationModel = mongoose.model<Donation>("Donation", donationSchema);
