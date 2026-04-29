import mongoose, { Schema } from "mongoose";

export const VolunteerStatuses = ["ACTIVE", "INACTIVE", "BLACKLISTED"] as const;

export interface Volunteer {
  branchId: mongoose.Types.ObjectId;
  fullName: string;
  phone?: string;
  email?: string;
  skills: string[];
  joinedCampaignIds: mongoose.Types.ObjectId[];
  status: (typeof VolunteerStatuses)[number];
  createdAt: Date;
  updatedAt: Date;
}

const volunteerSchema = new Schema<Volunteer>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    fullName: { type: String, required: true, trim: true, maxlength: 140 },
    phone: { type: String, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200 },
    skills: { type: [String], default: [] },
    joinedCampaignIds: { type: [Schema.Types.ObjectId], ref: "Campaign", default: [] },
    status: { type: String, enum: VolunteerStatuses, default: "ACTIVE", index: true }
  },
  { timestamps: true }
);

volunteerSchema.index({ branchId: 1, status: 1, createdAt: -1 });

export const VolunteerModel = mongoose.model<Volunteer>("Volunteer", volunteerSchema);
