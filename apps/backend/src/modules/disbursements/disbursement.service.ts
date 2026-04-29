import mongoose from "mongoose";
import { BadRequestError, NotFoundError } from "../../common/errors/app-error";
import { AuthContext, branchScopedFilter, ensureBranchScope } from "../../common/validators/auth-scope";
import { writeActivityLog } from "../activity-logs/activity-log.service";
import { BeneficiaryModel } from "../beneficiaries/beneficiary.model";
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

export function createDisbursementService(model: any = DisbursementModel) {
  return {
    async list(auth: AuthContext, campaignId?: string) {
      const filter: Record<string, unknown> = { ...branchScopedFilter(auth) };
      if (campaignId) filter.campaignId = new mongoose.Types.ObjectId(campaignId);
      return model.find(filter).sort({ createdAt: -1 }).lean();
    },

    async create(payload: Record<string, unknown>, auth: AuthContext) {
      ensureBranchScope(auth, String(payload.branchId));

      const beneficiary = await BeneficiaryModel.findById(payload.beneficiaryId).lean();
      if (!beneficiary) throw new NotFoundError("Beneficiary not found");

      const campaignId = new mongoose.Types.ObjectId(String(payload.campaignId));
      const available = await computeAvailableAmount(campaignId);
      if (Number(payload.amount) > available) {
        throw new BadRequestError("Disbursement exceeds available amount");
      }

      const created = await model.create(payload);
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
