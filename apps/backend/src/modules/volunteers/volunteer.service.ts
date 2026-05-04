import { BadRequestError } from "../../common/errors/app-error";
import { requireActiveBranch, requireCampaignIdsInBranch } from "../../common/validators/business-rules";
import { AuthContext, branchScopedFilter, ensureBranchScope } from "../../common/validators/auth-scope";
import { VolunteerModel } from "./volunteer.model";

export function createVolunteerService(model: any = VolunteerModel) {
  return {
    async list(auth: AuthContext) {
      return model.find(branchScopedFilter(auth)).sort({ createdAt: -1 }).lean();
    },

    async create(payload: Record<string, unknown>, auth: AuthContext) {
      ensureBranchScope(auth, String(payload.branchId));
      await requireActiveBranch(payload.branchId);
      await requireCampaignIdsInBranch(payload.joinedCampaignIds as unknown[] | undefined, payload.branchId);

      // Business trigger: a new volunteer always starts as ACTIVE unless the
      // caller explicitly marks them inactive; BLACKLISTED is only allowed by update.
      if (payload.status === "BLACKLISTED") {
        throw new BadRequestError("New volunteer cannot start as BLACKLISTED");
      }

      const created = await model.create(payload);
      return created.toObject();
    },

    async update(id: string, payload: Record<string, unknown>, auth: AuthContext) {
      const existing = await model.findById(id).lean();
      if (!existing) return null;
      ensureBranchScope(auth, existing.branchId);
      const nextBranchId = payload.branchId ?? existing.branchId;
      ensureBranchScope(auth, String(nextBranchId));
      await requireActiveBranch(nextBranchId);
      await requireCampaignIdsInBranch(
        (payload.joinedCampaignIds as unknown[] | undefined) ?? existing.joinedCampaignIds ?? [],
        nextBranchId
      );
      return model.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
    }
  };
}
