import mongoose from "mongoose";
import { BadRequestError, NotFoundError } from "../../common/errors/app-error";
import { requireActiveBranch, requireBeneficiaryInBranch, requireCampaignInBranch } from "../../common/validators/business-rules";
import { AuthContext, branchScopedFilter, ensureBranchScope } from "../../common/validators/auth-scope";
import { writeActivityLog } from "../activity-logs/activity-log.service";
import { CampaignModel } from "../campaigns/campaign.model";
import { DonationModel } from "../donations/donation.model";
import { DisbursementModel } from "./disbursement.model";

async function computeAvailableAmount(campaignId: mongoose.Types.ObjectId, session?: mongoose.ClientSession): Promise<number> {
  const donationAgg = await DonationModel.aggregate([
    { $match: { campaignId, paymentStatus: "SUCCESS" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]).session(session ?? null);

  const disbursementAgg = await DisbursementModel.aggregate([
    { $match: { campaignId, status: "COMPLETED" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]).session(session ?? null);

  const donated = Number(donationAgg[0]?.total ?? 0);
  const disbursed = Number(disbursementAgg[0]?.total ?? 0);
  return donated - disbursed;
}

function validateDisbursementTransition(currentStatus: string, nextStatus: string, proofs?: unknown[]): void {
  if (currentStatus === nextStatus) {
    return;
  }

  const allowedTransitions: Record<string, string[]> = {
    PENDING: ["APPROVED", "REJECTED"],
    APPROVED: ["COMPLETED", "REJECTED"],
    COMPLETED: [],
    REJECTED: []
  };

  // Business trigger: disbursement status is a workflow, not just an enum.
  // Mongoose can validate allowed strings, but only service logic knows which
  // transitions are legal and when proof documents are mandatory.
  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    throw new BadRequestError(`Cannot transition disbursement from ${currentStatus} to ${nextStatus}`);
  }
  if (nextStatus === "COMPLETED" && (!Array.isArray(proofs) || proofs.length === 0)) {
    throw new BadRequestError("Completion requires at least one proof document");
  }
}

export function createDisbursementService(model: any = DisbursementModel) {
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
      const beneficiary = await requireBeneficiaryInBranch(payload.beneficiaryId, payload.branchId, {
        requireVerified: true
      });
      if (String(beneficiary.campaignId) !== String(campaign._id)) {
        throw new BadRequestError("Beneficiary does not belong to the selected campaign");
      }

      const campaignId = campaign._id;
      const available = await computeAvailableAmount(campaignId);
      if (Number(payload.amount) > available) {
        throw new BadRequestError("Disbursement exceeds available amount");
      }

      // Business trigger: branchId is derived from the campaign after all
      // cross-reference checks pass, so shard routing cannot be spoofed.
      const created = await model.create({
        ...payload,
        branchId: campaign.branchId,
        campaignId: campaign._id,
        beneficiaryId: beneficiary._id,
        status: "PENDING"
      });
      await writeActivityLog(
        {
          branchId: String(created.branchId),
          action: "DISBURSEMENT_CREATED",
          entityType: "disbursement",
          entityId: String(created._id),
          after: created.toObject()
        },
        { actorId: auth.userId, actorRole: auth.role, actorBranchId: auth.branchId }
      );
      return created.toObject();
    },

    async transition(id: string, status: string, auth: AuthContext, proofs?: unknown[]) {
      const existing = await model.findById(id).lean();
      if (!existing) return null;
      ensureBranchScope(auth, existing.branchId);
      validateDisbursementTransition(existing.status, status, proofs);

      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const updateDoc: Record<string, unknown> = { status };
        if (status === "APPROVED") {
          updateDoc.approvedBy = new mongoose.Types.ObjectId(auth.userId);
          updateDoc.approvedAt = new Date();
        }
        if (status === "COMPLETED") {
          const available = await computeAvailableAmount(existing.campaignId, session);
          if (existing.amount > available) {
            throw new BadRequestError("Disbursement exceeds available amount");
          }
          updateDoc.disbursedAt = new Date();
          if (Array.isArray(proofs) && proofs.length > 0) {
            updateDoc.proofs = proofs;
          }
          await CampaignModel.findByIdAndUpdate(existing.campaignId, { $inc: { disbursedAmount: existing.amount } }, { session });
        }

        const updated = await model.findByIdAndUpdate(id, updateDoc, { new: true, runValidators: true, session }).lean();
        if (!updated) throw new NotFoundError("Disbursement not found");

        await writeActivityLog(
          {
            branchId: String(updated.branchId),
            action: `DISBURSEMENT_${status}`,
            entityType: "disbursement",
            entityId: String(updated._id),
            before: existing,
            after: updated
          },
          { actorId: auth.userId, actorRole: auth.role, actorBranchId: auth.branchId },
          session
        );

        await session.commitTransaction();
        return updated;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
    }
  };
}
