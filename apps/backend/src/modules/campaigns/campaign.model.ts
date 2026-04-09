import mongoose, { Schema } from "mongoose";

export interface Campaign {
  code: string;
  name: string;
  description?: string;
  targetAmount: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<Campaign>(
  {
    code: { type: String, required: true, trim: true, maxlength: 50, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    targetAmount: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date }
  },
  { timestamps: true }
);

campaignSchema.index({ isActive: 1, createdAt: -1 });

export const CampaignModel = mongoose.model<Campaign>("Campaign", campaignSchema);
