import mongoose, { Schema } from "mongoose";

export const AidDistributionTypes = ["MONEY", "ITEM", "SERVICE", "MIXED"] as const;
export const AidDistributionStatuses = [
  "PENDING",
  "APPROVED",
  "DELIVERED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED"
] as const;

interface BeneficiarySnapshot {
  name: string;
  type: string;
  phone?: string;
  addressSummary?: string;
}

interface CampaignSnapshot {
  code: string;
  title: string;
}

interface BranchSnapshot {
  code: string;
  name: string;
}

interface MoneySupport {
  amount: number;
  currency: string;
  method: string;
}

interface ItemSupport {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedValue?: number;
  note?: string;
}

interface ServiceSupport {
  serviceName: string;
  provider: string;
  estimatedHours: number;
  estimatedValue?: number;
  note?: string;
}

interface Proof {
  type: string;
  url: string;
  description?: string;
  uploadedAt: Date;
  uploadedBy?: mongoose.Types.ObjectId;
}

export interface AidDistribution {
  branchId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  beneficiaryId: mongoose.Types.ObjectId;
  type: (typeof AidDistributionTypes)[number];
  status: (typeof AidDistributionStatuses)[number];
  approvedBy?: mongoose.Types.ObjectId;
  deliveredAt?: Date;
  completedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  
  // Snapshots for audit
  beneficiarySnapshot: BeneficiarySnapshot;
  campaignSnapshot: CampaignSnapshot;
  branchSnapshot: BranchSnapshot;
  
  // Dynamic support fields based on type
  moneySupport?: MoneySupport;
  itemSupports?: ItemSupport[];
  serviceSupport?: ServiceSupport;
  
  // Proofs
  proofs: Proof[];
  
  // Metadata
  note?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const beneficiarySnapshotSchema = new Schema<BeneficiarySnapshot>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    type: { type: String, required: true, trim: true, maxlength: 50 },
    phone: { type: String, trim: true, maxlength: 20 },
    addressSummary: { type: String, trim: true, maxlength: 300 }
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

const moneySupportSchema = new Schema<MoneySupport>(
  {
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, trim: true, maxlength: 10 },
    method: { type: String, required: true, trim: true, maxlength: 50 }
  },
  { _id: false }
);

const itemSupportSchema = new Schema<ItemSupport>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true, trim: true, maxlength: 50 },
    estimatedValue: { type: Number, min: 0 },
    note: { type: String, trim: true, maxlength: 500 }
  },
  { _id: false }
);

const serviceSupportSchema = new Schema<ServiceSupport>(
  {
    serviceName: { type: String, required: true, trim: true, maxlength: 200 },
    provider: { type: String, required: true, trim: true, maxlength: 200 },
    estimatedHours: { type: Number, required: true, min: 0.5 },
    estimatedValue: { type: Number, min: 0 },
    note: { type: String, trim: true, maxlength: 500 }
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

const aidDistributionSchema = new Schema<AidDistribution>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    type: { type: String, enum: AidDistributionTypes, required: true, index: true },
    status: { type: String, enum: AidDistributionStatuses, default: "PENDING", index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deliveredAt: { type: Date },
    completedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    
    beneficiarySnapshot: { type: beneficiarySnapshotSchema, required: true },
    campaignSnapshot: { type: campaignSnapshotSchema, required: true },
    branchSnapshot: { type: branchSnapshotSchema, required: true },
    
    moneySupport: { type: moneySupportSchema },
    itemSupports: { type: [itemSupportSchema], default: [] },
    serviceSupport: { type: serviceSupportSchema },
    
    proofs: { type: [proofSchema], default: [] },
    note: { type: String, trim: true, maxlength: 2000 }
  },
  { timestamps: true }
);

aidDistributionSchema.index({ branchId: 1, campaignId: 1, status: 1, createdAt: -1 });
aidDistributionSchema.index({ branchId: 1, beneficiaryId: 1, status: 1 });
aidDistributionSchema.index({ campaignId: 1, status: 1 });
aidDistributionSchema.index({ branchId: 1, status: 1, createdAt: -1 });

export const AidDistributionModel = mongoose.model<AidDistribution>(
  "AidDistribution",
  aidDistributionSchema
);
