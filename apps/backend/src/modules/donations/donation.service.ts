import { DonationStatus } from "./donation.model";
import { DonationModel } from "./donation.model";
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
  list(query: DonationListQuery): Promise<PaginatedResult<Record<string, unknown>>>;
  getById(id: string): Promise<Record<string, unknown> | null>;
  create(input: CreateDonationInput): Promise<Record<string, unknown>>;
  update(id: string, input: UpdateDonationInput): Promise<Record<string, unknown> | null>;
  updateStatus(
    id: string,
    status: DonationStatus
  ): Promise<Record<string, unknown> | null>;
  remove(id: string): Promise<boolean>;
  aggregateOverview(match?: Record<string, unknown>): Promise<DonationOverviewStats>;
}

function escapeRegex(pattern: string): string {
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildDonationFilter(query: DonationListQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  if (query.campaignCode) {
    filter.campaignCode = query.campaignCode;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.donorEmail) {
    filter.donorEmail = query.donorEmail.toLowerCase();
  }

  if (query.search) {
    const regex = { $regex: escapeRegex(query.search), $options: "i" };
    filter.$or = [{ donorName: regex }, { note: regex }];
  }

  return filter;
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

  const byStatus = byStatusRows.map((row) => ({
    status: String(row.status) as DonationStatus,
    count: Number(row.count ?? 0),
    totalAmount: Number(row.totalAmount ?? 0)
  }));

  return {
    totalDonations: Number(totalStats.totalDonations ?? 0),
    totalAmount: Number(totalStats.totalAmount ?? 0),
    byStatus
  };
}

export function createDonationService(model: any = DonationModel): DonationService {
  return {
    async list(query) {
      const filter = buildDonationFilter(query);
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

    async getById(id) {
      return model.findById(id).lean();
    },

    async create(input) {
      const created = await model.create(input);
      return created.toObject ? created.toObject() : created;
    },

    async update(id, input) {
      return model.findByIdAndUpdate(id, input, { new: true, runValidators: true }).lean();
    },

    async updateStatus(id, status) {
      return model.findByIdAndUpdate(id, { status }, { new: true, runValidators: true }).lean();
    },

    async remove(id) {
      const deleted = await model.findByIdAndDelete(id).lean();
      return Boolean(deleted);
    },

    async aggregateOverview(match = {}) {
      const rows = await model.aggregate([
        { $match: match },
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
                  _id: "$status",
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
