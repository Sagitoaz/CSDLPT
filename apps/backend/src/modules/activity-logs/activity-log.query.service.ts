import mongoose from "mongoose";
import { branchScopedFilter, AuthContext, isSuperAdmin } from "../../common/validators/auth-scope";
import { ActivityLogModel } from "./activity-log.model";

export function createActivityLogQueryService(model: any = ActivityLogModel) {
  return {
    async list(auth: AuthContext, query: { entityType?: string; entityId?: string; branchId?: string; limit?: number }) {
      const filter: Record<string, unknown> = { ...branchScopedFilter(auth) };
      if (query.entityType) filter.entityType = query.entityType;
      if (query.entityId) filter.entityId = query.entityId;
      if (query.branchId && isSuperAdmin(auth)) filter.branchId = new mongoose.Types.ObjectId(query.branchId);
      return model.find(filter).sort({ createdAt: -1 }).limit(query.limit ?? 100).lean();
    }
  };
}
