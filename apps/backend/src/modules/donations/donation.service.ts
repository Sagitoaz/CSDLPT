import mongoose from "mongoose";
import { BadRequestError, NotFoundError } from "../../common/errors/app-error";
import { AuthContext, branchScopedFilter, ensureBranchScope, isSuperAdmin } from "../../common/validators/auth-scope";
import { writeActivityLog } from "../activity-logs/activity-log.service";
import { CampaignModel } from "../campaigns/campaign.model";
import { DonorModel } from "../donors/donor.model";
import { DonationModel, PaymentStatuses } from "./donation.model";
import { CreateDonationInput, DonationListQuery, UpdateDonationInput } from "./donation.schemas";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export type DonationStatus = (typeof PaymentStatuses)[number];

export interface DonationStatusStats {
  status: DonationStatus;
  count: number;
  totalAmount: number;
}

export interface DonationOverviewStats {
  totalDonations: number;
  totalAmount: number;
  byStatus: DonationStatusStats[];
}

export interface DonationService {
  list(query: DonationListQuery, auth: AuthContext): Promise<PaginatedResult<Record<string, unknown>>>;
  getById(id: string, auth: AuthContext): Promise<Record<string, unknown> | null>;
  create(input: CreateDonationInput, auth: AuthContext): Promise<Record<string, unknown>>;
  update(id: string, input: UpdateDonationInput, auth: AuthContext): Promise<Record<string, unknown> | null>;
  updateStatus(id: string, status: DonationStatus, auth: AuthContext): Promise<Record<string, unknown> | null>;
  remove(id: string, auth: AuthContext): Promise<boolean>;
  aggregateOverview(match: Record<string, unknown>, auth: AuthContext): Promise<DonationOverviewStats>;
}

function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit)
  };
}

function mapOverview(aggregationRows: Array<Record<string, unknown>>): DonationOverviewStats {
  const firstRow = aggregationRows[0] ?? {};
  const totals = Array.isArray(firstRow.totals)
    ? (firstRow.totals as Array<Record<string, unknown>>)
    : [];
  const byStatusRows = Array.isArray(firstRow.byStatus)
    ? (firstRow.byStatus as Array<Record<string, unknown>>)
    : [];

  const totalStats = totals[0] ?? {};

  return {
    totalDonations: Number(totalStats.totalDonations ?? 0),
    totalAmount: Number(totalStats.totalAmount ?? 0),
    byStatus: byStatusRows.map((row) => ({
      status: String(row.status) as DonationStatus,
      count: Number(row.count ?? 0),
      totalAmount: Number(row.totalAmount ?? 0)
    }))
  };
}

function nextCampaignDelta(previous: DonationStatus, next: DonationStatus, amount: number): number {
  if (previous !== "SUCCESS" && next === "SUCCESS") {
    return amount;
  }

  if (previous === "SUCCESS" && next === "REFUNDED") {
    return -amount;
  }

  return 0;
}

export function createDonationService(model: any = DonationModel): DonationService {
  return {
    async list(query, auth) {
      const filter: Record<string, unknown> = {
        ...branchScopedFilter(auth)
      };

      if (query.campaignId) {
        filter.campaignId = new mongoose.Types.ObjectId(query.campaignId);
      }
      if (query.donorId) {
        filter.donorId = new mongoose.Types.ObjectId(query.donorId);
      }
      if (query.paymentStatus) {
        filter.paymentStatus = query.paymentStatus;
      }
      if (query.branchId && isSuperAdmin(auth)) {
        filter.branchId = new mongoose.Types.ObjectId(query.branchId);
      }

      const skip = (query.page - 1) * query.limit;
      const sortDirection = query.sortDir === "asc" ? 1 : -1;
      const sort = { [query.sortBy]: sortDirection };

      const [rows, total] = await Promise.all([
        model.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
        model.countDocuments(filter)
      ]);

      return {
        data: rows,
        pagination: buildPaginationMeta(query.page, query.limit, Number(total))
      };
    },

    async getById(id, auth) {
      const donation = await model.findById(id).lean();
      if (!donation) {
        return null;
      }
      ensureBranchScope(auth, donation.branchId);
      return donation;
    },

    async create(input, auth) {
      const campaign = await CampaignModel.findById(input.campaignId).lean();
      if (!campaign) {
        throw new NotFoundError("Campaign not found");
      }
      ensureBranchScope(auth, campaign.branchId);

      const donor = await DonorModel.findById(input.donorId).lean();
      if (!donor) {
        throw new NotFoundError("Donor not found");
      }

      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const createdDonation = await model.create(
          [
            {
              branchId: campaign.branchId,
              campaignId: campaign._id,
              donorId: donor._id,
              donorSnapshot: {
                fullName: donor.fullName,
                phone: donor.phone,
                email: donor.email
              },
              campaignSnapshot: {
                code: campaign.code,
                title: campaign.title
              },
              amount: input.amount,
              paymentMethod: input.paymentMethod,
              paymentStatus: input.paymentStatus ?? "PENDING",
              donatedAt: input.donatedAt ?? new Date(),
              transactionCode: input.transactionCode,
              message: input.message
            }
          ],
          { session }
        );

        const donation = createdDonation[0];

        if (donation.paymentStatus === "SUCCESS") {
          await CampaignModel.findByIdAndUpdate(
            campaign._id,
            { $inc: { currentAmount: donation.amount } },
            { session }
          );
          await DonorModel.findByIdAndUpdate(donor._id, { $inc: { totalDonated: donation.amount } }, { session });
        }

        await writeActivityLog(
          {
            branchId: String(campaign.branchId),
            action: "DONATION_CREATED",
            entityType: "donation",
            entityId: String(donation._id),
            description: `Donation created with status ${donation.paymentStatus}`,
            after: donation.toObject()
          },
          { actorId: auth.userId, actorRole: auth.role, actorBranchId: auth.branchId },
          session
        );

        await session.commitTransaction();
        return donation.toObject();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
    },

    async update(id, input, auth) {
      const existing = await model.findById(id).lean();
      if (!existing) {
        return null;
      }
      ensureBranchScope(auth, existing.branchId);

      if (existing.paymentStatus === "SUCCESS") {
        throw new BadRequestError("Cannot modify successful donation");
      }

      const updated = await model.findByIdAndUpdate(id, input, { new: true, runValidators: true }).lean();
      if (updated) {
        await writeActivityLog(
          {
            branchId: String(updated.branchId),
            action: "DONATION_UPDATED",
            entityType: "donation",
            entityId: String(updated._id),
            before: existing,
            after: updated
          },
          { actorId: auth.userId, actorRole: auth.role, actorBranchId: auth.branchId }
        );
      }
      return updated;
    },

    async updateStatus(id, status, auth) {
      const existing = await model.findById(id).lean();
      if (!existing) {
        return null;
      }
      ensureBranchScope(auth, existing.branchId);

      if (existing.paymentStatus === status) {
        return existing;
      }

      const delta = nextCampaignDelta(existing.paymentStatus, status, existing.amount);

      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const updated = await model
          .findByIdAndUpdate(id, { paymentStatus: status }, { new: true, runValidators: true, session })
          .lean();

        if (!updated) {
          throw new NotFoundError("Donation not found");
        }

        if (delta !== 0) {
          const campaign = await CampaignModel.findById(updated.campaignId).session(session);
          if (!campaign) {
            throw new NotFoundError("Campaign not found");
          }

          if (campaign.currentAmount + delta < 0) {
            throw new BadRequestError("Campaign currentAmount cannot be negative");
          }

          campaign.currentAmount += delta;
          await campaign.save({ session });

          await DonorModel.findByIdAndUpdate(updated.donorId, { $inc: { totalDonated: delta } }, { session });
        }

        await writeActivityLog(
          {
            branchId: String(updated.branchId),
            action: "DONATION_STATUS_UPDATED",
            entityType: "donation",
            entityId: String(updated._id),
            description: `${existing.paymentStatus} -> ${status}`,
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
    },

    async remove(id, auth) {
      const existing = await model.findById(id).lean();
      if (!existing) {
        return false;
      }
      ensureBranchScope(auth, existing.branchId);

      if (existing.paymentStatus === "SUCCESS") {
        throw new BadRequestError("Cannot delete successful donation");
      }

      const deleted = await model.findByIdAndDelete(id).lean();
      if (deleted) {
        await writeActivityLog(
          {
            branchId: String(deleted.branchId),
            action: "DONATION_DELETED",
            entityType: "donation",
            entityId: String(deleted._id),
            before: deleted
          },
          { actorId: auth.userId, actorRole: auth.role, actorBranchId: auth.branchId }
        );
      }
      return Boolean(deleted);
    },

    async aggregateOverview(match, auth) {
      const scopedMatch = {
        ...match,
        ...branchScopedFilter(auth)
      };

      const rows = await model.aggregate([
        { $match: scopedMatch },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalDonations: { $sum: 1 },
                  totalAmount: { $sum: "$amount" }
                }
              },
              { $project: { _id: 0, totalDonations: 1, totalAmount: 1 } }
            ],
            byStatus: [
              {
                $group: {
                  _id: "$paymentStatus",
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$amount" }
                }
              },
              { $project: { _id: 0, status: "$_id", count: 1, totalAmount: 1 } },
              { $sort: { status: 1 } }
            ]
          }
        }
      ]);

      return mapOverview(rows);
    }
  };
}
