import mongoose, { ClientSession } from "mongoose";
import { BadRequestError } from "../../common/errors/app-error";
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
  const branchId = payload.branchId ?? context.actorBranchId;
  if (!branchId) {
    throw new BadRequestError("Activity log requires branchId or actorBranchId");
  }

  // Business trigger: audit logs are sharded by branchId, so every log must
  // have a branch key. Falling back to actorBranchId keeps branch-local actions
  // routed correctly even when the caller omits payload.branchId.
  await ActivityLogModel.create(
    [
      {
        branchId: new mongoose.Types.ObjectId(branchId),
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
