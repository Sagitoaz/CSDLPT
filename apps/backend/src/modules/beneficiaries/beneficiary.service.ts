import mongoose from "mongoose";
import { ensureBranchScope, branchScopedFilter, AuthContext } from "../../common/validators/auth-scope";
import { BeneficiaryModel } from "./beneficiary.model";
import { writeActivityLog } from "../activity-logs/activity-log.service";

export function createBeneficiaryService(model: any = BeneficiaryModel) {
  return {
    async list(auth: AuthContext, campaignId?: string) {
      const filter: Record<string, unknown> = { ...branchScopedFilter(auth) };
      if (campaignId) filter.campaignId = new mongoose.Types.ObjectId(campaignId);
      return model.find(filter).sort({ createdAt: -1 }).lean();
    },

    async create(payload: Record<string, unknown>, auth: AuthContext) {
      ensureBranchScope(auth, String(payload.branchId));
      const created = await model.create(payload);
      await writeActivityLog(
        {
          branchId: String(created.branchId),
          action: "BENEFICIARY_CREATED",
          entityType: "beneficiary",
          entityId: String(created._id),
          after: created.toObject()
        },
        { actorId: auth.userId, actorRole: auth.role, actorBranchId: auth.branchId }
      );
      return created.toObject();
    },

    async verify(id: string, status: string, auth: AuthContext) {
      const existing = await model.findById(id).lean();
      if (!existing) return null;
      ensureBranchScope(auth, existing.branchId);
      const updated = await model
        .findByIdAndUpdate(
          id,
          { verificationStatus: status, verifiedBy: new mongoose.Types.ObjectId(auth.userId), verifiedAt: new Date() },
          { new: true, runValidators: true }
        )
        .lean();
      if (updated) {
        await writeActivityLog(
          {
            branchId: String(updated.branchId),
            action: "BENEFICIARY_VERIFIED",
            entityType: "beneficiary",
            entityId: String(updated._id),
            before: existing,
            after: updated
          },
          { actorId: auth.userId, actorRole: auth.role, actorBranchId: auth.branchId }
        );
      }
      return updated;
    }
  };
}
