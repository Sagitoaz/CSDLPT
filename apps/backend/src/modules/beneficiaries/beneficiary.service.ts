import mongoose from "mongoose";
import { BadRequestError } from "../../common/errors/app-error";
import { requireActiveBranch, requireCampaignInBranch } from "../../common/validators/business-rules";
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
      await requireActiveBranch(payload.branchId);
      const campaign = await requireCampaignInBranch(payload.campaignId, payload.branchId);

      // Business trigger: beneficiaries are registered under the campaign's
      // branch, never under a client-provided branch that could disagree.
      const created = await model.create({
        ...payload,
        branchId: campaign.branchId,
        campaignId: campaign._id,
        verificationStatus: "PENDING"
      });
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
      if (existing.verificationStatus === status) {
        return existing;
      }
      if (existing.verificationStatus === "REJECTED" && status === "VERIFIED") {
        throw new BadRequestError("Rejected beneficiary must be reviewed before verification");
      }
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
