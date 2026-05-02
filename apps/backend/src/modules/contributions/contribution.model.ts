import mongoose, { Schema } from "mongoose";

export const ContributionTypes = [
  "MONEY",
  "ITEM",
  "MEDICINE",
  "CLOTHES",
  "BOOK",
  "SERVICE",
  "VOLUNTEER_WORK"
] as const;

export const ContributionStatuses = ["PENDING", "CONFIRMED", "RECEIVED", "REJECTED"] as const;

interface ContributorSnapshot {
  fullName: string;
  organizationName?: string;
  phone?: string;
  email?: string;
  type: "INDIVIDUAL" | "ORGANIZATION" | "SERVICE_PROVIDER";
}

interface CampaignSnapshot {
  code: string;
  title: string;
}

interface BranchSnapshot {
  code: string;
  name: string;
}

interface MoneyDetail {
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  transactionCode: string;
  paidAt?: Date;
}

interface ItemDetail {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  condition?: string;
  estimatedValue?: number;
  note?: string;
}

interface ServiceDetail {
  serviceName: string;
  provider: string;
  estimatedHours: number;
  estimatedValue?: number;
  note?: string;
}

interface VolunteerWorkDetail {
  skill: string;
  hours: number;
  workDate: Date;
  description?: string;
}

interface Proof {
  type: string;
  url: string;
  description?: string;
  uploadedAt: Date;
  uploadedBy?: mongoose.Types.ObjectId;
}

export interface Contribution {
  branchId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  contributorId: mongoose.Types.ObjectId;
  type: (typeof ContributionTypes)[number];
  status: (typeof ContributionStatuses)[number];
  receivedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  
  // Snapshots
  contributorSnapshot: ContributorSnapshot;
  campaignSnapshot: CampaignSnapshot;
  branchSnapshot: BranchSnapshot;
  
  // Dynamic detail fields based on type
  moneyDetail?: MoneyDetail;
  itemDetails?: ItemDetail[];
  serviceDetail?: ServiceDetail;
  volunteerWorkDetail?: VolunteerWorkDetail;
  
  // Proof & metadata
  proofs: Proof[];
  
  createdAt: Date;
  updatedAt: Date;
}

const contributorSnapshotSchema = new Schema<ContributorSnapshot>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 140 },
    organizationName: { type: String, trim: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200 },
    type: { type: String, enum: ["INDIVIDUAL", "ORGANIZATION", "SERVICE_PROVIDER"], required: true }
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

const branchSnapshotSchema = new Schema<BranchSnapshot>(
  {
    code: { type: String, required: true, trim: true, maxlength: 50 },
    name: { type: String, required: true, trim: true, maxlength: 200 }
  },
  { _id: false }
);

const moneyDetailSchema = new Schema<MoneyDetail>(
  {
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, trim: true, maxlength: 10 },
    paymentMethod: { type: String, required: true, trim: true, maxlength: 50 },
    paymentStatus: { type: String, enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"], default: "PENDING" },
    transactionCode: { type: String, required: true, trim: true, maxlength: 100, unique: true, sparse: true },
    paidAt: { type: Date }
  },
  { _id: false }
);

const itemDetailSchema = new Schema<ItemDetail>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true, trim: true, maxlength: 50 },
    condition: { type: String, trim: true, maxlength: 100 },
    estimatedValue: { type: Number, min: 0 },
    note: { type: String, trim: true, maxlength: 500 }
  },
  { _id: false }
);

const serviceDetailSchema = new Schema<ServiceDetail>(
  {
    serviceName: { type: String, required: true, trim: true, maxlength: 200 },
    provider: { type: String, required: true, trim: true, maxlength: 200 },
    estimatedHours: { type: Number, required: true, min: 0.5 },
    estimatedValue: { type: Number, min: 0 },
    note: { type: String, trim: true, maxlength: 500 }
  },
  { _id: false }
);

const volunteerWorkDetailSchema = new Schema<VolunteerWorkDetail>(
  {
    skill: { type: String, required: true, trim: true, maxlength: 200 },
    hours: { type: Number, required: true, min: 0.5 },
    workDate: { type: Date, required: true },
    description: { type: String, trim: true, maxlength: 500 }
  },
  { _id: false }
);

const proofSchema = new Schema<Proof>(
  {
    type: { type: String, required: true, trim: true, maxlength: 50 },
    url: { type: String, required: true, trim: true, maxlength: 500 },
    description: { type: String, trim: true, maxlength: 500 },
    uploadedAt: { type: Date, required: true, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { _id: false }
);

const contributionSchema = new Schema<Contribution>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    contributorId: { type: Schema.Types.ObjectId, ref: "Contributor", required: true, index: true },
    type: { type: String, enum: ContributionTypes, required: true, index: true },
    status: { type: String, enum: ContributionStatuses, default: "PENDING", index: true },
    receivedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    
    contributorSnapshot: { type: contributorSnapshotSchema, required: true },
    campaignSnapshot: { type: campaignSnapshotSchema, required: true },
    branchSnapshot: { type: branchSnapshotSchema, required: true },
    
    moneyDetail: { type: moneyDetailSchema },
    itemDetails: { type: [itemDetailSchema], default: [] },
    serviceDetail: { type: serviceDetailSchema },
    volunteerWorkDetail: { type: volunteerWorkDetailSchema },
    
    proofs: { type: [proofSchema], default: [] }
  },
  { timestamps: true }
);

contributionSchema.index({ branchId: 1, campaignId: 1, createdAt: -1 });
contributionSchema.index({ branchId: 1, status: 1, type: 1, createdAt: -1 });
contributionSchema.index({ contributorId: 1, createdAt: -1 });
contributionSchema.index({ campaignId: 1, status: 1, createdAt: -1 });

export const ContributionModel = mongoose.model<Contribution>("Contribution", contributionSchema);
