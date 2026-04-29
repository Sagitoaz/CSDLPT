import mongoose, { Schema } from "mongoose";

export const BranchTypes = ["HEADQUARTER", "BRANCH", "REGIONAL_CENTER"] as const;
export const BranchStatuses = ["ACTIVE", "INACTIVE", "LOCKED"] as const;

export interface Branch {
  name: string;
  code: string;
  type: (typeof BranchTypes)[number];
  parentId?: mongoose.Types.ObjectId;
  province: string;
  district?: string;
  ward?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: (typeof BranchStatuses)[number];
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<Branch>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    code: { type: String, required: true, trim: true, maxlength: 50, unique: true, index: true },
    type: { type: String, enum: BranchTypes, default: "BRANCH", index: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Branch" },
    province: { type: String, required: true, trim: true, maxlength: 100, index: true },
    district: { type: String, trim: true, maxlength: 100 },
    ward: { type: String, trim: true, maxlength: 100 },
    address: { type: String, trim: true, maxlength: 500 },
    phone: { type: String, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200 },
    status: { type: String, enum: BranchStatuses, default: "ACTIVE", index: true }
  },
  { timestamps: true }
);

branchSchema.index({ status: 1, createdAt: -1 });

export const BranchModel = mongoose.model<Branch>("Branch", branchSchema);
