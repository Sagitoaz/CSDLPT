import mongoose, { Schema } from "mongoose";

export const CampaignTypes = [
  "FLOOD_RELIEF",
  "SCHOLARSHIP",
  "MEDICAL_SUPPORT",
  "FOOD_SUPPORT",
  "CHILD_SUPPORT",
  "DISASTER_RELIEF",
  "OTHER"
] as const;

export const CampaignStatuses = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"] as const;

interface CampaignLocation {
  province: string;
  district?: string;
  ward?: string;
  address?: string;
}

interface CampaignImage {
  url: string;
  caption?: string;
}

export interface Campaign {
  branchId: mongoose.Types.ObjectId;
  code: string;
  title: string;
  description?: string;
  type: (typeof CampaignTypes)[number];
  status: (typeof CampaignStatuses)[number];
  targetAmount: number;
  currentAmount: number;
  disbursedAmount: number;
  startDate?: Date;
  endDate?: Date;
  location: CampaignLocation;
  organizerId?: mongoose.Types.ObjectId;
  images: CampaignImage[];
  proofImages: CampaignImage[];
  metadata?: Record<string, unknown>;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const campaignLocationSchema = new Schema<CampaignLocation>(
  {
    province: { type: String, required: true, trim: true, maxlength: 100 },
    district: { type: String, trim: true, maxlength: 100 },
    ward: { type: String, trim: true, maxlength: 100 },
    address: { type: String, trim: true, maxlength: 500 }
  },
  { _id: false }
);

const campaignImageSchema = new Schema<CampaignImage>(
  {
    url: { type: String, required: true, trim: true, maxlength: 500 },
    caption: { type: String, trim: true, maxlength: 200 }
  },
  { _id: false }
);

const campaignSchema = new Schema<Campaign>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    code: { type: String, required: true, trim: true, maxlength: 50, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 3000 },
    type: { type: String, enum: CampaignTypes, default: "OTHER", index: true },
    status: { type: String, enum: CampaignStatuses, default: "DRAFT", index: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, default: 0, min: 0 },
    disbursedAmount: { type: Number, default: 0, min: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    location: { type: campaignLocationSchema, required: true },
    organizerId: { type: Schema.Types.ObjectId, ref: "User" },
    images: { type: [campaignImageSchema], default: [] },
    proofImages: { type: [campaignImageSchema], default: [] },
    metadata: { type: Schema.Types.Mixed },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

campaignSchema.index({ branchId: 1, status: 1, createdAt: -1 });
campaignSchema.index({ branchId: 1, type: 1, createdAt: -1 });
campaignSchema.index({ "location.province": 1, createdAt: -1 });

export const CampaignModel = mongoose.model<Campaign>("Campaign", campaignSchema);
