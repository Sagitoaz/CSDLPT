// Option A - Simple demo: distribute donations by campaignCode.
// Good for demonstrating 4 shards, but does not pin each branch to a specific shard.
use charity_distributed

db.donations.createIndex({ campaignCode: "hashed" })
sh.shardCollection(
  "charity_distributed.donations",
  { campaignCode: "hashed" }
)

// Option B - Recommended when 4 branch servers must map to 4 branch shards.
// Requires branchCode to be stored in donations and payment_transactions.
use charity_distributed

db.donations.createIndex({ branchCode: 1, campaignCode: "hashed" })
sh.shardCollection(
  "charity_distributed.donations",
  { branchCode: 1, campaignCode: "hashed" }
)

// Zone mapping example for branch-oriented data placement.
sh.addShardToZone("shard_branch_1", "zone_CN1")
sh.addShardToZone("shard_branch_2", "zone_CN2")
sh.addShardToZone("shard_branch_3", "zone_CN3")
sh.addShardToZone("shard_branch_4", "zone_CN4")

// Zone ranges below assume branchCode values CN1 < CN2 < CN3 < CN4.
// For production, prefer a controlled numeric branchNo or carefully managed branchCode order.
sh.updateZoneKeyRange(
  "charity_distributed.donations",
  { branchCode: "CN1", campaignCode: MinKey },
  { branchCode: "CN2", campaignCode: MinKey },
  "zone_CN1"
)

sh.updateZoneKeyRange(
  "charity_distributed.donations",
  { branchCode: "CN2", campaignCode: MinKey },
  { branchCode: "CN3", campaignCode: MinKey },
  "zone_CN2"
)

sh.updateZoneKeyRange(
  "charity_distributed.donations",
  { branchCode: "CN3", campaignCode: MinKey },
  { branchCode: "CN4", campaignCode: MinKey },
  "zone_CN3"
)

sh.updateZoneKeyRange(
  "charity_distributed.donations",
  { branchCode: "CN4", campaignCode: MinKey },
  { branchCode: MaxKey, campaignCode: MaxKey },
  "zone_CN4"
)
