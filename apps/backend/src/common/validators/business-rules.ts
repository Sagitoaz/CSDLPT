import mongoose, { Types } from "mongoose";
import { BadRequestError, NotFoundError } from "../errors/app-error";
import { BeneficiaryModel } from "../../modules/beneficiaries/beneficiary.model";
import { BranchModel } from "../../modules/branches/branch.model";
import { CampaignModel } from "../../modules/campaigns/campaign.model";

export function toObjectId(value: unknown, fieldName: string): Types.ObjectId {
  if (!value || !mongoose.Types.ObjectId.isValid(String(value))) {
    throw new BadRequestError(`${fieldName} must be a valid ObjectId`);
  }

  return new mongoose.Types.ObjectId(String(value));
}

export async function requireActiveBranch(branchId: unknown): Promise<Record<string, any>> {
  const branchObjectId = toObjectId(branchId, "branchId");
  const branch = await BranchModel.findById(branchObjectId).lean();

  // This is the application-level equivalent of a foreign-key trigger:
  // every branch-scoped record must point to an existing active branch.
  if (!branch) {
    throw new NotFoundError("Branch not found");
  }
  if (branch.status !== "ACTIVE") {
    throw new BadRequestError("Branch is not active");
  }

  return branch;
}

export async function requireCampaignInBranch(
  campaignId: unknown,
  branchId: unknown,
  options: { allowCompleted?: boolean; allowCancelled?: boolean } = {}
): Promise<Record<string, any>> {
  const campaignObjectId = toObjectId(campaignId, "campaignId");
  const branchObjectId = toObjectId(branchId, "branchId");
  const campaign = await CampaignModel.findById(campaignObjectId).lean();

  // Campaign-derived writes must stay in the same regional partition.
  // If this check is skipped, a payload can point to branch A while using
  // a campaign from branch B, which makes shard placement and reports wrong.
  if (!campaign) {
    throw new NotFoundError("Campaign not found");
  }
  if (String(campaign.branchId) !== String(branchObjectId)) {
    throw new BadRequestError("Campaign does not belong to the selected branch");
  }
  if (!options.allowCompleted && campaign.status === "COMPLETED") {
    throw new BadRequestError("Campaign is already completed");
  }
  if (!options.allowCancelled && campaign.status === "CANCELLED") {
    throw new BadRequestError("Campaign is cancelled");
  }

  return campaign;
}

export async function requireBeneficiaryInBranch(
  beneficiaryId: unknown,
  branchId: unknown,
  options: { requireVerified?: boolean } = {}
): Promise<Record<string, any>> {
  const beneficiaryObjectId = toObjectId(beneficiaryId, "beneficiaryId");
  const branchObjectId = toObjectId(branchId, "branchId");
  const beneficiary = await BeneficiaryModel.findById(beneficiaryObjectId).lean();

  // Aid/disbursement records are only valid when the beneficiary is owned by
  // the same branch. This protects both business correctness and zone routing.
  if (!beneficiary) {
    throw new NotFoundError("Beneficiary not found");
  }
  if (String(beneficiary.branchId) !== String(branchObjectId)) {
    throw new BadRequestError("Beneficiary does not belong to the selected branch");
  }
  if (options.requireVerified && beneficiary.verificationStatus !== "VERIFIED") {
    throw new BadRequestError("Beneficiary must be verified before receiving aid");
  }

  return beneficiary;
}

export async function requireCampaignIdsInBranch(campaignIds: unknown[] = [], branchId: unknown): Promise<void> {
  const uniqueIds = [...new Set(campaignIds.map((id) => String(id)).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return;
  }

  const branchObjectId = toObjectId(branchId, "branchId");
  const objectIds = uniqueIds.map((id) => toObjectId(id, "joinedCampaignIds"));
  const count = await CampaignModel.countDocuments({
    _id: { $in: objectIds },
    branchId: branchObjectId,
    status: { $ne: "CANCELLED" }
  });

  // Volunteer campaign memberships should not silently cross branch
  // boundaries, otherwise branch-local screens and shard-local reads drift.
  if (count !== uniqueIds.length) {
    throw new BadRequestError("All joined campaigns must exist in the volunteer branch and not be cancelled");
  }
}
