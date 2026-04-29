use charity_distributed

db.createCollection("users")
db.createCollection("campaigns")
db.createCollection("donations")
db.createCollection("payment_transactions")
db.createCollection("campaign_reports")
db.createCollection("audit_logs")
db.createCollection("stats_snapshots")

db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1, branchCode: 1 })
db.users.createIndex({ isActive: 1, role: 1 })

db.campaigns.createIndex({ code: 1 }, { unique: true })
db.campaigns.createIndex({ isActive: 1, createdAt: -1 })
db.campaigns.createIndex({ name: "text", code: "text" })
db.campaigns.createIndex({ branchCode: 1, createdAt: -1 })

db.donations.createIndex({ campaignCode: 1, createdAt: -1 })
db.donations.createIndex({ status: 1, createdAt: -1 })
db.donations.createIndex({ donorEmail: 1, createdAt: -1 })
db.donations.createIndex({ amount: -1 })
// For branch-oriented sharding:
db.donations.createIndex({ branchCode: 1, campaignCode: "hashed" })

db.payment_transactions.createIndex({ donationId: 1, createdAt: -1 })
db.payment_transactions.createIndex({ campaignCode: 1, createdAt: -1 })
db.payment_transactions.createIndex({ branchCode: 1, createdAt: -1 })
db.payment_transactions.createIndex({ status: 1, createdAt: -1 })
db.payment_transactions.createIndex({ providerTxnId: 1 }, { sparse: true })

db.campaign_reports.createIndex({ campaignCode: 1, reportPeriod: -1 })
db.campaign_reports.createIndex({ branchCode: 1, reportPeriod: -1 })
db.campaign_reports.createIndex({ reportStatus: 1, createdAt: -1 })

db.audit_logs.createIndex({ requestId: 1 })
db.audit_logs.createIndex({ actorId: 1, createdAt: -1 })
db.audit_logs.createIndex({ resource: 1, resourceId: 1 })
db.audit_logs.createIndex({ createdAt: -1 })

db.stats_snapshots.createIndex({ scope: 1, branchCode: 1, campaignCode: 1, calculatedAt: -1 })
db.stats_snapshots.createIndex({ calculatedAt: -1 })
