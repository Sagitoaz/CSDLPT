import mongoose, { Schema } from "mongoose";

export interface ActivityLog {
  branchId?: mongoose.Types.ObjectId;
  targetBranchId?: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId;
  actorRole?: string;
  actorBranchId?: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId: string;
  description?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const activityLogSchema = new Schema<ActivityLog>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", index: true },
    targetBranchId: { type: Schema.Types.ObjectId, ref: "Branch", index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorRole: { type: String, trim: true, maxlength: 50 },
    actorBranchId: { type: Schema.Types.ObjectId, ref: "Branch", index: true },
    action: { type: String, required: true, trim: true, maxlength: 100 },
    entityType: { type: String, required: true, trim: true, maxlength: 100, index: true },
    entityId: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ipAddress: { type: String, trim: true, maxlength: 100 },
    userAgent: { type: String, trim: true, maxlength: 300 }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ branchId: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
activityLogSchema.index({ actorId: 1, createdAt: -1 });

export const ActivityLogModel = mongoose.model<ActivityLog>("ActivityLog", activityLogSchema);
