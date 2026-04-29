import mongoose, { Schema } from "mongoose";

export const DisbursementStatuses = ["PENDING", "APPROVED", "COMPLETED", "REJECTED"] as const;

interface Proof {
  type: string;
  url: string;
  description?: string;
  uploadedAt: Date;
  uploadedBy?: mongoose.Types.ObjectId;
}

export interface Disbursement {
  branchId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  beneficiaryId: mongoose.Types.ObjectId;
  amount: number;
  purpose: string;
  method: string;
  status: (typeof DisbursementStatuses)[number];
  proofs: Proof[];
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  disbursedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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

const disbursementSchema = new Schema<Disbursement>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "Beneficiary", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    purpose: { type: String, required: true, trim: true, maxlength: 2000 },
    method: { type: String, required: true, trim: true, maxlength: 50 },
    status: { type: String, enum: DisbursementStatuses, default: "PENDING", index: true },
    proofs: { type: [proofSchema], default: [] },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    disbursedAt: { type: Date }
  },
  { timestamps: true }
);

disbursementSchema.index({ branchId: 1, campaignId: 1, status: 1, createdAt: -1 });
disbursementSchema.index({ branchId: 1, beneficiaryId: 1, status: 1 });

export const DisbursementModel = mongoose.model<Disbursement>("Disbursement", disbursementSchema);
