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
export const CampaignVisibility = ["PUBLIC", "INTERNAL"] as const;

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

interface TimeRange {
  startDate: Date;
  endDate: Date;
}

interface CampaignGoal {
  targetMoneyAmount: number;
  targetItemSummary?: string;
  targetVolunteerCount?: number;
}

interface RequiredResource {
  resourceType: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedValue?: number;
  note?: string;
}

interface SummaryStats {
  totalMoneyReceived: number;
  totalEstimatedItemValue: number;
  totalVolunteerHours: number;
  totalMoneyDistributed: number;
  totalEstimatedAidValue: number;
  beneficiaryCount: number;
}

interface Document {
  url: string;
  name: string;
  type?: string;
}

export interface Campaign {
  branchId: mongoose.Types.ObjectId;
  code: string;
  title: string;
  description?: string;
  type: (typeof CampaignTypes)[number];
  status: (typeof CampaignStatuses)[number];
  visibility: (typeof CampaignVisibility)[number];
  targetAmount: number;
  currentAmount: number;
  disbursedAmount: number;
  startDate?: Date;
  endDate?: Date;
  timeRange: TimeRange;
  location: CampaignLocation;
  goals: CampaignGoal;
  requiredResources: RequiredResource[];
  summaryStats: SummaryStats;
  organizerId?: mongoose.Types.ObjectId;
  images: CampaignImage[];
  proofImages: CampaignImage[];
  documents: Document[];
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

const timeRangeSchema = new Schema<TimeRange>(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  { _id: false }
);

const campaignGoalSchema = new Schema<CampaignGoal>(
  {
    targetMoneyAmount: { type: Number, required: true, min: 0 },
    targetItemSummary: { type: String, trim: true, maxlength: 500 },
    targetVolunteerCount: { type: Number, min: 0 }
  },
  { _id: false }
);

const requiredResourceSchema = new Schema<RequiredResource>(
  {
    resourceType: { type: String, required: true, trim: true, maxlength: 50 },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true, trim: true, maxlength: 50 },
    estimatedValue: { type: Number, min: 0 },
    note: { type: String, trim: true, maxlength: 500 }
  },
  { _id: false }
);

const summaryStatsSchema = new Schema<SummaryStats>(
  {
    totalMoneyReceived: { type: Number, default: 0, min: 0 },
    totalEstimatedItemValue: { type: Number, default: 0, min: 0 },
    totalVolunteerHours: { type: Number, default: 0, min: 0 },
    totalMoneyDistributed: { type: Number, default: 0, min: 0 },
    totalEstimatedAidValue: { type: Number, default: 0, min: 0 },
    beneficiaryCount: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const documentSchema = new Schema<Document>(
  {
    url: { type: String, required: true, trim: true, maxlength: 500 },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    type: { type: String, trim: true, maxlength: 50 }
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
    visibility: { type: String, enum: CampaignVisibility, default: "PUBLIC" },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, default: 0, min: 0 },
    disbursedAmount: { type: Number, default: 0, min: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    timeRange: { type: timeRangeSchema, required: true },
    location: { type: campaignLocationSchema, required: true },
    goals: { type: campaignGoalSchema, required: true },
    requiredResources: { type: [requiredResourceSchema], default: [] },
    summaryStats: { type: summaryStatsSchema, default: {} },
    organizerId: { type: Schema.Types.ObjectId, ref: "User" },
    images: { type: [campaignImageSchema], default: [] },
    proofImages: { type: [campaignImageSchema], default: [] },
    documents: { type: [documentSchema], default: [] },
    metadata: { type: Schema.Types.Mixed },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

campaignSchema.index({ branchId: 1, status: 1, createdAt: -1 });
campaignSchema.index({ branchId: 1, type: 1, createdAt: -1 });
campaignSchema.index({ "location.province": 1, createdAt: -1 });
campaignSchema.index({ branchId: 1, visibility: 1, status: 1 });

export const CampaignModel = mongoose.model<Campaign>("Campaign", campaignSchema);
