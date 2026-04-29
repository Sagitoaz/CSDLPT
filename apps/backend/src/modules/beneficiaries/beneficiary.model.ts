import mongoose, { Schema } from "mongoose";

export const BeneficiaryTypes = ["INDIVIDUAL", "FAMILY", "ORGANIZATION", "COMMUNITY"] as const;
export const BeneficiaryVerificationStatuses = ["PENDING", "VERIFIED", "REJECTED"] as const;

interface BeneficiaryLocation {
  province: string;
  district?: string;
  ward?: string;
  address?: string;
}

export interface Beneficiary {
  branchId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  name: string;
  type: (typeof BeneficiaryTypes)[number];
  phone?: string;
  location: BeneficiaryLocation;
  situationDescription?: string;
  verificationStatus: (typeof BeneficiaryVerificationStatuses)[number];
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<BeneficiaryLocation>(
  {
    province: { type: String, required: true, trim: true, maxlength: 100 },
    district: { type: String, trim: true, maxlength: 100 },
    ward: { type: String, trim: true, maxlength: 100 },
    address: { type: String, trim: true, maxlength: 500 }
  },
  { _id: false }
);

const beneficiarySchema = new Schema<Beneficiary>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    type: { type: String, enum: BeneficiaryTypes, default: "INDIVIDUAL" },
    phone: { type: String, trim: true, maxlength: 20 },
    location: { type: locationSchema, required: true },
    situationDescription: { type: String, trim: true, maxlength: 2000 },
    verificationStatus: {
      type: String,
      enum: BeneficiaryVerificationStatuses,
      default: "PENDING",
      index: true
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

beneficiarySchema.index({ branchId: 1, campaignId: 1, verificationStatus: 1 });

export const BeneficiaryModel = mongoose.model<Beneficiary>("Beneficiary", beneficiarySchema);
