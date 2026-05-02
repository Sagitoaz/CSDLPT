import mongoose, { Schema } from "mongoose";

export const ContributorTypes = ["INDIVIDUAL", "ORGANIZATION", "SERVICE_PROVIDER"] as const;

interface Address {
  street?: string;
  district?: string;
  province?: string;
  country?: string;
}

interface TotalContributionStats {
  moneyCount: number;
  totalMoneyAmount: number;
  itemCount: number;
  totalEstimatedItemValue: number;
  serviceCount: number;
  totalServiceValue: number;
  volunteerCount: number;
  totalVolunteerHours: number;
}

export interface Contributor {
  userId?: mongoose.Types.ObjectId;
  fullName: string;
  organizationName?: string;
  type: (typeof ContributorTypes)[number];
  phone?: string;
  email?: string;
  address?: Address;
  branchId?: mongoose.Types.ObjectId;
  totalContributionStats: TotalContributionStats;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<Address>(
  {
    street: { type: String, trim: true, maxlength: 300 },
    district: { type: String, trim: true, maxlength: 100 },
    province: { type: String, trim: true, maxlength: 100 },
    country: { type: String, trim: true, maxlength: 100 }
  },
  { _id: false }
);

const totalContributionStatsSchema = new Schema<TotalContributionStats>(
  {
    moneyCount: { type: Number, default: 0, min: 0 },
    totalMoneyAmount: { type: Number, default: 0, min: 0 },
    itemCount: { type: Number, default: 0, min: 0 },
    totalEstimatedItemValue: { type: Number, default: 0, min: 0 },
    serviceCount: { type: Number, default: 0, min: 0 },
    totalServiceValue: { type: Number, default: 0, min: 0 },
    volunteerCount: { type: Number, default: 0, min: 0 },
    totalVolunteerHours: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const contributorSchema = new Schema<Contributor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    fullName: { type: String, required: true, trim: true, maxlength: 140, index: true },
    organizationName: { type: String, trim: true, maxlength: 200 },
    type: { type: String, enum: ContributorTypes, default: "INDIVIDUAL", index: true },
    phone: { type: String, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200, sparse: true },
    address: { type: addressSchema },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", index: true },
    totalContributionStats: { type: totalContributionStatsSchema, default: {} },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

contributorSchema.index({ branchId: 1, createdAt: -1 });
contributorSchema.index({ email: 1, branchId: 1 }, { sparse: true });
contributorSchema.index({ type: 1, isActive: 1 });

export const ContributorModel = mongoose.model<Contributor>("Contributor", contributorSchema);
