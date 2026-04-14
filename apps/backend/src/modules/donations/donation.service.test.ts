import assert from "node:assert/strict";
import test from "node:test";
import { buildDonationFilter, createDonationService } from "./donation.service";

test("buildDonationFilter builds campaign/status/search correctly", () => {
  const filter = buildDonationFilter({
    page: 1,
    limit: 10,
    campaignCode: "hoc-bong-2026",
    status: "verified",
    donorEmail: "USER@MAIL.COM",
    search: "nguyen",
    sortBy: "createdAt",
    sortDir: "desc"
  });

  assert.equal(filter.campaignCode, "hoc-bong-2026");
  assert.equal(filter.status, "verified");
  assert.equal(filter.donorEmail, "user@mail.com");
  assert.ok(Array.isArray(filter.$or as unknown[]));
});

test("donation service list applies pagination and sorting", async () => {
  const calls: Record<string, unknown> = {};
  const rows = [{ _id: "1", donorName: "A" }];

  const mockModel = {
    find(filter: Record<string, unknown>) {
      calls.filter = filter;
      return {
        sort(sortObj: Record<string, number>) {
          calls.sort = sortObj;
          return {
            skip(value: number) {
              calls.skip = value;
              return {
                limit(limitValue: number) {
                  calls.limit = limitValue;
                  return {
                    lean: async () => rows
                  };
                }
              };
            }
          };
        }
      };
    },
    countDocuments: async () => 11,
    aggregate: async () => []
  };

  const service = createDonationService(mockModel);
  const result = await service.list({
    page: 2,
    limit: 5,
    sortBy: "amount",
    sortDir: "asc"
  });

  assert.deepEqual(calls.sort, { amount: 1 });
  assert.equal(calls.skip, 5);
  assert.equal(calls.limit, 5);
  assert.equal(result.pagination.total, 11);
  assert.equal(result.pagination.totalPages, 3);
  assert.equal(result.data.length, 1);
});

test("donation service aggregateOverview maps aggregate output", async () => {
  const mockModel = {
    aggregate: async () => [
      {
        totals: [{ totalDonations: 2, totalAmount: 30000 }],
        byStatus: [
          { status: "pending", count: 1, totalAmount: 10000 },
          { status: "verified", count: 1, totalAmount: 20000 }
        ]
      }
    ]
  };

  const service = createDonationService(mockModel);
  const result = await service.aggregateOverview();

  assert.equal(result.totalDonations, 2);
  assert.equal(result.totalAmount, 30000);
  assert.equal(result.byStatus.length, 2);
});
