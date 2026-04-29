import mongoose, { ClientSession } from "mongoose";
import { ActivityLogModel } from "./activity-log.model";

export interface ActivityContext {
  actorId?: string;
  actorRole?: string;
  actorBranchId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ActivityPayload {
  branchId?: string;
  targetBranchId?: string;
  action: string;
  entityType: string;
  entityId: string;
  description?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export async function writeActivityLog(
  payload: ActivityPayload,
  context: ActivityContext,
  session?: ClientSession
): Promise<void> {
  await ActivityLogModel.create(
    [
      {
        branchId: payload.branchId ? new mongoose.Types.ObjectId(payload.branchId) : undefined,
        targetBranchId: payload.targetBranchId
          ? new mongoose.Types.ObjectId(payload.targetBranchId)
          : undefined,
        actorId: context.actorId ? new mongoose.Types.ObjectId(context.actorId) : undefined,
        actorRole: context.actorRole,
        actorBranchId: context.actorBranchId
          ? new mongoose.Types.ObjectId(context.actorBranchId)
          : undefined,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        description: payload.description,
        before: payload.before,
        after: payload.after,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    ],
    session ? { session } : undefined
  );
}
