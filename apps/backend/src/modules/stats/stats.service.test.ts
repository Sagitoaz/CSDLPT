import assert from "node:assert/strict";
import test from "node:test";
import { createStatsService } from "./stats.service";

test("stats service combines donation and campaign summaries", async () => {
  const statsService = createStatsService({
    donationService: {
      list: async () => ({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
      getById: async () => null,
      create: async () => ({}),
      update: async () => null,
      updateStatus: async () => null,
      remove: async () => false,
      aggregateOverview: async () => ({
        totalDonations: 10,
        totalAmount: 1000000,
        byStatus: [{ status: "verified", count: 10, totalAmount: 1000000 }]
      })
    },
    campaignService: {
      list: async () => ({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
      getByCode: async () => ({ code: "hoc-bong-2026", name: "Hoc bong 2026" }),
      create: async () => ({}),
      updateByCode: async () => null,
      removeByCode: async () => false,
      getSummary: async () => ({ total: 3, active: 2, inactive: 1 })
    }
  });

  const result = await statsService.getOverview();

  assert.equal(result.donations.totalDonations, 10);
  assert.equal(result.campaigns.active, 2);
});

test("stats service returns null for unknown campaign", async () => {
  const statsService = createStatsService({
    donationService: {
      list: async () => ({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
      getById: async () => null,
      create: async () => ({}),
      update: async () => null,
      updateStatus: async () => null,
      remove: async () => false,
      aggregateOverview: async () => ({ totalDonations: 0, totalAmount: 0, byStatus: [] })
    },
    campaignService: {
      list: async () => ({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
      getByCode: async () => null,
      create: async () => ({}),
      updateByCode: async () => null,
      removeByCode: async () => false,
      getSummary: async () => ({ total: 0, active: 0, inactive: 0 })
    }
  });

  const result = await statsService.getCampaignStats("unknown");
  assert.equal(result, null);
});
