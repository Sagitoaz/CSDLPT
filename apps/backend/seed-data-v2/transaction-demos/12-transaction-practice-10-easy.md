# 10 bai luyen transaction de cho du an nay

Tai lieu nay dung de luyen tap transaction MongoDB cho project `charity_distributed`.

## Dieu kien truoc khi chay

- Da chay seed data trong `apps/backend/seed-data-v2/seeds/index.mongodb`.
- Da ket noi vao `mongos`, khong ket noi truc tiep vao shard.
- Database dung trong cac vi du la `charity_distributed`.

```javascript
db = db.getSiblingDB("charity_distributed")
```

## Cach hoc

- Moi de bai deu co muc tieu va loi giai mau.
- Loi giai viet theo kieu copy-paste chay duoc trong `mongosh`.
- Neu muon tu luyen, ban co the che phan `Loi giai` di truoc.

---

## Bai 1. Tao contribution tien va cap nhat tong tien cua campaign

### De bai

Hay tao 1 transaction de:
- chen 1 document vao `contributions`
- tang `campaigns.currentAmount`
- tang `contributors.totalContributionStats.moneyCount`
- tang `contributors.totalContributionStats.totalMoneyAmount`
- ghi 1 log vao `activity_logs`

### Loi giai

```javascript
db = db.getSiblingDB("charity_distributed");

var t01RunId = `TX-PRACTICE-01-${Date.now()}`;
var t01Branch = db.branches.findOne({ status: "ACTIVE" }, { sort: { _id: 1 } });
var t01Campaign = db.campaigns.findOne({ branchId: t01Branch._id, status: { $in: ["ACTIVE", "PAUSED", "DRAFT"] } });
var t01Contributor = db.contributors.findOne({ branchId: t01Branch._id, isActive: true });
if (!t01Branch || !t01Campaign || !t01Contributor) {
  throw new Error("Missing seed data. Run seeds first.");
}

var t01Amount = 250000;
var t01Session = db.getMongo().startSession();
var t01TxDb = t01Session.getDatabase("charity_distributed");

try {
  t01Session.startTransaction({ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });

  var t01ContributionId = ObjectId();
  t01TxDb.contributions.insertOne({
    _id: t01ContributionId,
    branchId: t01Branch._id,
    campaignId: t01Campaign._id,
    contributorId: t01Contributor._id,
    type: "MONEY",
    status: "RECEIVED",
    receivedAt: new Date(),
    createdBy: ObjectId(),
    contributorSnapshot: {
      fullName: t01Contributor.fullName || t01Contributor.name,
      organizationName: t01Contributor.organizationName,
      phone: t01Contributor.phone,
      email: t01Contributor.email,
      type: t01Contributor.type
    },
    campaignSnapshot: { code: t01Campaign.code, title: t01Campaign.title || t01Campaign.name },
    branchSnapshot: { code: t01Branch.code, name: t01Branch.name },
    moneyDetail: {
      amount: t01Amount,
      currency: "VND",
      paymentMethod: "BANK_TRANSFER",
      paymentStatus: "SUCCESS",
      transactionCode: t01RunId,
      paidAt: new Date()
    },
    proofs: [{ type: "BANK_RECEIPT", url: `https://example.com/${t01RunId}.pdf`, uploadedAt: new Date() }],
    demoBatch: t01RunId,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  t01TxDb.campaigns.updateOne(
    { _id: t01Campaign._id },
    { $inc: { currentAmount: t01Amount, "summaryStats.totalMoneyReceived": t01Amount }, $set: { updatedAt: new Date() } }
  );

  t01TxDb.contributors.updateOne(
    { _id: t01Contributor._id },
    { $inc: { "totalContributionStats.moneyCount": 1, "totalContributionStats.totalMoneyAmount": t01Amount }, $set: { updatedAt: new Date() } }
  );

  t01TxDb.activity_logs.insertOne({
    _id: ObjectId(),
    branchId: t01Branch._id,
    targetBranchId: t01Branch._id,
    actorId: ObjectId(),
    actorRole: "STAFF",
    actorBranchId: t01Branch._id,
    action: "TX_PRACTICE_CONTRIBUTION_RECEIVED",
    entityType: "Contribution",
    entityId: String(t01ContributionId),
    description: `Practice 01 contribution ${t01RunId}`,
    demoBatch: t01RunId,
    createdAt: new Date()
  });

  t01Session.commitTransaction();
  print(`COMMIT OK: ${t01RunId}`);
} catch (err) {
  t01Session.abortTransaction();
  print(`ROLLBACK: ${err.message}`);
  throw err;
} finally {
  t01Session.endSession();
}
```

---

## Bai 2. Tao contribution hang va cap nhat estimated value

### De bai

Hay tao 1 contribution kieu `ITEM` hoac `MEDICINE` va:
- chen vao `contributions`
- tang `contributors.totalContributionStats.itemCount`
- tang `contributors.totalContributionStats.totalEstimatedItemValue`
- ghi log giao dich

### Loi giai

```javascript
db = db.getSiblingDB("charity_distributed");

var t02RunId = `TX-PRACTICE-02-${Date.now()}`;
var t02Branch = db.branches.findOne({ status: "ACTIVE" }, { sort: { _id: 1 } });
var t02Campaign = db.campaigns.findOne({ branchId: t02Branch._id }, { sort: { code: 1 } });
var t02Contributor = db.contributors.findOne({ branchId: t02Branch._id, isActive: true });
if (!t02Branch || !t02Campaign || !t02Contributor) {
  throw new Error("Missing seed data. Run seeds first.");
}

var t02Session = db.getMongo().startSession();
var t02TxDb = t02Session.getDatabase("charity_distributed");

try {
  t02Session.startTransaction({ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });

  var t02ContributionId = ObjectId();
  var t02Value = 175000;

  t02TxDb.contributions.insertOne({
    _id: t02ContributionId,
    branchId: t02Branch._id,
    campaignId: t02Campaign._id,
    contributorId: t02Contributor._id,
    type: "ITEM",
    status: "RECEIVED",
    receivedAt: new Date(),
    createdBy: ObjectId(),
    contributorSnapshot: {
      fullName: t02Contributor.fullName || t02Contributor.name,
      organizationName: t02Contributor.organizationName,
      phone: t02Contributor.phone,
      email: t02Contributor.email,
      type: t02Contributor.type
    },
    campaignSnapshot: { code: t02Campaign.code, title: t02Campaign.title || t02Campaign.name },
    branchSnapshot: { code: t02Branch.code, name: t02Branch.name },
    itemDetails: [{
      name: "Ao am",
      category: "CLOTHES",
      quantity: 5,
      unit: "bo",
      condition: "NEW",
      estimatedValue: t02Value,
      note: "Practice item contribution"
    }],
    proofs: [{ type: "PHOTO", url: `https://example.com/${t02RunId}.jpg`, uploadedAt: new Date() }],
    demoBatch: t02RunId,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  t02TxDb.contributors.updateOne(
    { _id: t02Contributor._id },
    { $inc: { "totalContributionStats.itemCount": 1, "totalContributionStats.totalEstimatedItemValue": t02Value }, $set: { updatedAt: new Date() } }
  );

  t02TxDb.activity_logs.insertOne({
    _id: ObjectId(),
    branchId: t02Branch._id,
    targetBranchId: t02Branch._id,
    actorId: ObjectId(),
    actorRole: "STAFF",
    actorBranchId: t02Branch._id,
    action: "TX_PRACTICE_ITEM_RECEIVED",
    entityType: "Contribution",
    entityId: String(t02ContributionId),
    description: `Practice 02 item contribution ${t02RunId}`,
    demoBatch: t02RunId,
    createdAt: new Date()
  });

  t02Session.commitTransaction();
  print(`COMMIT OK: ${t02RunId}`);
} catch (err) {
  t02Session.abortTransaction();
  print(`ROLLBACK: ${err.message}`);
  throw err;
} finally {
  t02Session.endSession();
}
```

---

## Bai 3. Tao contribution dich vu va cap nhat service stats

### De bai

Hay tao 1 contribution kieu `SERVICE` va:
- chen vao `contributions`
- cap nhat `contributors.totalContributionStats.serviceCount`
- cap nhat `contributors.totalContributionStats.totalServiceValue`
- ghi log

### Loi giai

```javascript
db = db.getSiblingDB("charity_distributed");

var t03RunId = `TX-PRACTICE-03-${Date.now()}`;
var t03Branch = db.branches.findOne({ status: "ACTIVE" }, { sort: { _id: 1 } });
var t03Campaign = db.campaigns.findOne({ branchId: t03Branch._id }, { sort: { code: 1 } });
var t03Contributor = db.contributors.findOne({ branchId: t03Branch._id, type: { $in: ["ORGANIZATION", "SERVICE_PROVIDER"] } });
if (!t03Branch || !t03Campaign || !t03Contributor) {
  throw new Error("Missing seed data. Run seeds first.");
}

var t03Session = db.getMongo().startSession();
var t03TxDb = t03Session.getDatabase("charity_distributed");

try {
  t03Session.startTransaction({ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });

  var t03ContributionId = ObjectId();
  var t03Value = 500000;

  t03TxDb.contributions.insertOne({
    _id: t03ContributionId,
    branchId: t03Branch._id,
    campaignId: t03Campaign._id,
    contributorId: t03Contributor._id,
    type: "SERVICE",
    status: "RECEIVED",
    receivedAt: new Date(),
    createdBy: ObjectId(),
    contributorSnapshot: {
      fullName: t03Contributor.fullName || t03Contributor.name,
      organizationName: t03Contributor.organizationName,
      phone: t03Contributor.phone,
      email: t03Contributor.email,
      type: t03Contributor.type
    },
    campaignSnapshot: { code: t03Campaign.code, title: t03Campaign.title || t03Campaign.name },
    branchSnapshot: { code: t03Branch.code, name: t03Branch.name },
    serviceDetail: {
      serviceName: "Van chuyen hang cuu tro",
      provider: t03Contributor.organizationName || t03Contributor.fullName || t03Contributor.name,
      estimatedHours: 8,
      estimatedValue: t03Value,
      note: "Practice service contribution"
    },
    demoBatch: t03RunId,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  t03TxDb.contributors.updateOne(
    { _id: t03Contributor._id },
    { $inc: { "totalContributionStats.serviceCount": 1, "totalContributionStats.totalServiceValue": t03Value }, $set: { updatedAt: new Date() } }
  );

  t03TxDb.activity_logs.insertOne({
    _id: ObjectId(),
    branchId: t03Branch._id,
    targetBranchId: t03Branch._id,
    actorId: ObjectId(),
    actorRole: "STAFF",
    actorBranchId: t03Branch._id,
    action: "TX_PRACTICE_SERVICE_RECEIVED",
    entityType: "Contribution",
    entityId: String(t03ContributionId),
    description: `Practice 03 service contribution ${t03RunId}`,
    demoBatch: t03RunId,
    createdAt: new Date()
  });

  t03Session.commitTransaction();
  print(`COMMIT OK: ${t03RunId}`);
} catch (err) {
  t03Session.abortTransaction();
  print(`ROLLBACK: ${err.message}`);
  throw err;
} finally {
  t03Session.endSession();
}
```

---

## Bai 4. Tao campaign moi va ghi audit log

### De bai

Hay tao 1 campaign moi cho 1 branch va:
- chen vao `campaigns`
- ghi 1 dong log vao `activity_logs`

### Loi giai

```javascript
db = db.getSiblingDB("charity_distributed");

var t04RunId = `TX-PRACTICE-04-${Date.now()}`;
var t04Branch = db.branches.findOne({ status: "ACTIVE" }, { sort: { _id: 1 } });
if (!t04Branch) {
  throw new Error("No branch found. Run seeds first.");
}

var t04Session = db.getMongo().startSession();
var t04TxDb = t04Session.getDatabase("charity_distributed");
var t04CampaignId = ObjectId();

try {
  t04Session.startTransaction({ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });

  t04TxDb.campaigns.insertOne({
    _id: t04CampaignId,
    branchId: t04Branch._id,
    code: `${t04Branch.code}-PRAC-01`,
    name: "Chien dich thuc hanh 01",
    title: "Chien dich thuc hanh 01",
    description: "Campaign practice for transaction training.",
    type: "FLOOD_RELIEF",
    status: "DRAFT",
    visibility: "PUBLIC",
    targetAmount: 10000000,
    currentAmount: 0,
    disbursedAmount: 0,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    location: {
      province: t04Branch.province,
      district: t04Branch.district,
      ward: t04Branch.ward,
      address: t04Branch.address
    },
    goals: {
      targetMoneyAmount: 10000000,
      targetItemSummary: "Gao, sua",
      targetVolunteerCount: 10
    },
    requiredResources: [],
    summaryStats: {
      totalMoneyReceived: 0,
      totalEstimatedItemValue: 0,
      totalVolunteerHours: 0,
      totalMoneyDistributed: 0,
      totalEstimatedAidValue: 0,
      beneficiaryCount: 0
    },
    createdBy: ObjectId(),
    organizerId: ObjectId(),
    images: [],
    proofImages: [],
    documents: [],
    metadata: {
      seedBatch: "practice-transaction",
      branchCode: t04Branch.code
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });

  t04TxDb.activity_logs.insertOne({
    _id: ObjectId(),
    branchId: t04Branch._id,
    targetBranchId: t04Branch._id,
    actorId: ObjectId(),
    actorRole: "BRANCH_ADMIN",
    actorBranchId: t04Branch._id,
    action: "TX_PRACTICE_CAMPAIGN_CREATED",
    entityType: "Campaign",
    entityId: String(t04CampaignId),
    description: `Practice 04 campaign ${t04RunId}`,
    demoBatch: t04RunId,
    createdAt: new Date()
  });

  t04Session.commitTransaction();
  print(`COMMIT OK: ${t04RunId}`);
} catch (err) {
  t04Session.abortTransaction();
  print(`ROLLBACK: ${err.message}`);
  throw err;
} finally {
  t04Session.endSession();
}
```

---

## Bai 5. Dang ky beneficiary moi va tang so luong beneficiary cua campaign

### De bai

Hay tao 1 beneficiary moi va:
- chen vao `beneficiaries`
- tang `campaigns.summaryStats.beneficiaryCount`
- ghi log

### Loi giai

```javascript
db = db.getSiblingDB("charity_distributed");

var t05RunId = `TX-PRACTICE-05-${Date.now()}`;
var t05Branch = db.branches.findOne({ status: "ACTIVE" }, { sort: { _id: 1 } });
var t05Campaign = db.campaigns.findOne({ branchId: t05Branch._id }, { sort: { code: 1 } });
if (!t05Branch || !t05Campaign) {
  throw new Error("Missing seed data. Run seeds first.");
}

var t05Session = db.getMongo().startSession();
var t05TxDb = t05Session.getDatabase("charity_distributed");
var t05BeneficiaryId = ObjectId();

try {
  t05Session.startTransaction({ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });

  t05TxDb.beneficiaries.insertOne({
    _id: t05BeneficiaryId,
    branchId: t05Branch._id,
    campaignId: t05Campaign._id,
    name: "Nguoi nhan ho tro thuc hanh 01",
    type: "INDIVIDUAL",
    email: "practice.beneficiary01@example.com",
    phone: "0900000001",
    address: {
      street: "1 Duong Thuc Hanh",
      district: t05Branch.district,
      province: t05Branch.province,
      country: "Viet Nam"
    },
    location: {
      province: t05Branch.province,
      district: t05Branch.district,
      ward: t05Branch.ward,
      address: "1 Duong Thuc Hanh"
    },
    householdSize: 4,
    incomeLevel: "LOW",
    reason: "POVERTY",
    healthIssues: [],
    education: "PRIMARY_SCHOOL",
    employment: "UNEMPLOYED",
    children: 2,
    children_ages: [5, 9],
    situationDescription: "Practice beneficiary for transaction training.",
    verificationStatus: "PENDING",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  });

  t05TxDb.campaigns.updateOne(
    { _id: t05Campaign._id },
    { $inc: { "summaryStats.beneficiaryCount": 1 }, $set: { updatedAt: new Date() } }
  );

  t05TxDb.activity_logs.insertOne({
    _id: ObjectId(),
    branchId: t05Branch._id,
    targetBranchId: t05Branch._id,
    actorId: ObjectId(),
    actorRole: "STAFF",
    actorBranchId: t05Branch._id,
    action: "TX_PRACTICE_BENEFICIARY_REGISTERED",
    entityType: "Beneficiary",
    entityId: String(t05BeneficiaryId),
    description: `Practice 05 beneficiary ${t05RunId}`,
    demoBatch: t05RunId,
    createdAt: new Date()
  });

  t05Session.commitTransaction();
  print(`COMMIT OK: ${t05RunId}`);
} catch (err) {
  t05Session.abortTransaction();
  print(`ROLLBACK: ${err.message}`);
  throw err;
} finally {
  t05Session.endSession();
}
```

---

## Bai 6. Xac minh beneficiary va cap nhat trang thai

### De bai

Hay tim 1 beneficiary dang `PENDING` va:
- doi `verificationStatus` sang `VERIFIED`
- set `verifiedBy`
- set `verifiedAt`
- ghi log

### Loi giai

```javascript
db = db.getSiblingDB("charity_distributed");

var t06RunId = `TX-PRACTICE-06-${Date.now()}`;
var t06Beneficiary = db.beneficiaries.findOne({ verificationStatus: "PENDING" }, { sort: { createdAt: 1 } });
if (!t06Beneficiary) {
  throw new Error("No PENDING beneficiary found.");
}

var t06Session = db.getMongo().startSession();
var t06TxDb = t06Session.getDatabase("charity_distributed");

try {
  t06Session.startTransaction({ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });

  t06TxDb.beneficiaries.updateOne(
    { _id: t06Beneficiary._id, verificationStatus: "PENDING" },
    {
      $set: {
        verificationStatus: "VERIFIED",
        verifiedBy: ObjectId(),
        verifiedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );

  t06TxDb.activity_logs.insertOne({
    _id: ObjectId(),
    branchId: t06Beneficiary.branchId,
    targetBranchId: t06Beneficiary.branchId,
    actorId: ObjectId(),
    actorRole: "BRANCH_ADMIN",
    actorBranchId: t06Beneficiary.branchId,
    action: "TX_PRACTICE_BENEFICIARY_VERIFIED",
    entityType: "Beneficiary",
    entityId: String(t06Beneficiary._id),
    description: `Practice 06 verify beneficiary ${t06RunId}`,
    demoBatch: t06RunId,
    createdAt: new Date()
  });

  t06Session.commitTransaction();
  print(`COMMIT OK: ${t06RunId}`);
} catch (err) {
  t06Session.abortTransaction();
  print(`ROLLBACK: ${err.message}`);
  throw err;
} finally {
  t06Session.endSession();
}
```

---

## Bai 7. Cho volunteer tham gia campaign

### De bai

Hay lay 1 volunteer va:
- them campaignId vao `joinedCampaignIds`
- cap nhat `updatedAt`
- ghi log

### Loi giai

```javascript
db = db.getSiblingDB("charity_distributed");

var t07RunId = `TX-PRACTICE-07-${Date.now()}`;
var t07Volunteer = db.volunteers.findOne({ status: "ACTIVE" }, { sort: { createdAt: 1 } });
var t07Campaign = db.campaigns.findOne({}, { sort: { code: 1 } });
if (!t07Volunteer || !t07Campaign) {
  throw new Error("Missing volunteer or campaign.");
}

var t07Session = db.getMongo().startSession();
var t07TxDb = t07Session.getDatabase("charity_distributed");

try {
  t07Session.startTransaction({ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });

  t07TxDb.volunteers.updateOne(
    { _id: t07Volunteer._id },
    {
      $addToSet: { joinedCampaignIds: t07Campaign._id },
      $set: { updatedAt: new Date() }
    }
  );

  t07TxDb.activity_logs.insertOne({
    _id: ObjectId(),
    branchId: t07Volunteer.branchId,
    targetBranchId: t07Volunteer.branchId,
    actorId: ObjectId(),
    actorRole: "STAFF",
    actorBranchId: t07Volunteer.branchId,
    action: "TX_PRACTICE_VOLUNTEER_JOINED",
    entityType: "Volunteer",
    entityId: String(t07Volunteer._id),
    description: `Practice 07 volunteer joined campaign ${t07RunId}`,
    demoBatch: t07RunId,
    createdAt: new Date()
  });

  t07Session.commitTransaction();
  print(`COMMIT OK: ${t07RunId}`);
} catch (err) {
  t07Session.abortTransaction();
  print(`ROLLBACK: ${err.message}`);
  throw err;
} finally {
  t07Session.endSession();
}
```

---

## Bai 8. Tao aid distribution va chuyen sang APPROVED

### De bai

Hay tao 1 aid distribution moi va:
- chen vao `aid_distributions`
- cap nhat `campaigns.disbursedAmount`
- cap nhat `campaigns.summaryStats.totalMoneyDistributed`
- ghi log

### Loi giai

```javascript
db = db.getSiblingDB("charity_distributed");

var t08RunId = `TX-PRACTICE-08-${Date.now()}`;
var t08Branch = db.branches.findOne({ status: "ACTIVE" }, { sort: { _id: 1 } });
var t08Campaign = db.campaigns.findOne({ branchId: t08Branch._id }, { sort: { code: 1 } });
var t08Beneficiary = db.beneficiaries.findOne({ branchId: t08Branch._id }, { sort: { name: 1 } });
if (!t08Branch || !t08Campaign || !t08Beneficiary) {
  throw new Error("Missing seed data. Run seeds first.");
}

var t08Session = db.getMongo().startSession();
var t08TxDb = t08Session.getDatabase("charity_distributed");
var t08AidId = ObjectId();
var t08Amount = 300000;

try {
  t08Session.startTransaction({ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });

  t08TxDb.aid_distributions.insertOne({
    _id: t08AidId,
    branchId: t08Branch._id,
    campaignId: t08Campaign._id,
    beneficiaryId: t08Beneficiary._id,
    type: "MONEY",
    status: "APPROVED",
    approvedBy: ObjectId(),
    createdBy: ObjectId(),
    moneySupport: {
      amount: t08Amount,
      currency: "VND",
      method: "BANK_TRANSFER"
    },
    beneficiarySnapshot: {
      name: t08Beneficiary.name,
      type: t08Beneficiary.type || "INDIVIDUAL",
      phone: t08Beneficiary.phone,
      addressSummary: `${t08Beneficiary.location?.district || t08Branch.district}, ${t08Beneficiary.location?.province || t08Branch.province}`
    },
    campaignSnapshot: { code: t08Campaign.code, title: t08Campaign.title || t08Campaign.name },
    branchSnapshot: { code: t08Branch.code, name: t08Branch.name },
    proofs: [],
    note: "Practice aid distribution",
    createdAt: new Date(),
    updatedAt: new Date()
  });

  t08TxDb.campaigns.updateOne(
    { _id: t08Campaign._id },
    {
      $inc: {
        disbursedAmount: t08Amount,
        "summaryStats.totalMoneyDistributed": t08Amount,
        "summaryStats.totalEstimatedAidValue": t08Amount
      },
      $set: { updatedAt: new Date() }
    }
  );

  t08TxDb.activity_logs.insertOne({
    _id: ObjectId(),
    branchId: t08Branch._id,
    targetBranchId: t08Branch._id,
    actorId: ObjectId(),
    actorRole: "STAFF",
    actorBranchId: t08Branch._id,
    action: "TX_PRACTICE_AID_APPROVED",
    entityType: "AidDistribution",
    entityId: String(t08AidId),
    description: `Practice 08 aid approved ${t08RunId}`,
    demoBatch: t08RunId,
    createdAt: new Date()
  });

  t08Session.commitTransaction();
  print(`COMMIT OK: ${t08RunId}`);
} catch (err) {
  t08Session.abortTransaction();
  print(`ROLLBACK: ${err.message}`);
  throw err;
} finally {
  t08Session.endSession();
}
```

---

## Bai 9. Hoan contribution va tru lai campaign/contributor stats

### De bai

Hay chon 1 contribution `RECEIVED` va:
- doi trang thai sang `REJECTED` hoac `REFUNDED`
- tru lai so tien da cong vao campaign
- tru lai stats cua contributor
- ghi log

### Loi giai

```javascript
db = db.getSiblingDB("charity_distributed");

var t09RunId = `TX-PRACTICE-09-${Date.now()}`;
var t09Contribution = db.contributions.findOne({ status: "RECEIVED", type: "MONEY" }, { sort: { createdAt: 1 } });
if (!t09Contribution) {
  throw new Error("No money contribution found for refund practice.");
}

var t09Amount = t09Contribution.moneyDetail?.amount || 0;
var t09Session = db.getMongo().startSession();
var t09TxDb = t09Session.getDatabase("charity_distributed");

try {
  t09Session.startTransaction({ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });

  t09TxDb.contributions.updateOne(
    { _id: t09Contribution._id, status: "RECEIVED" },
    {
      $set: {
        status: "REFUNDED",
        updatedAt: new Date()
      }
    }
  );

  t09TxDb.campaigns.updateOne(
    { _id: t09Contribution.campaignId },
    { $inc: { currentAmount: -t09Amount, "summaryStats.totalMoneyReceived": -t09Amount }, $set: { updatedAt: new Date() } }
  );

  t09TxDb.contributors.updateOne(
    { _id: t09Contribution.contributorId },
    { $inc: { "totalContributionStats.moneyCount": -1, "totalContributionStats.totalMoneyAmount": -t09Amount }, $set: { updatedAt: new Date() } }
  );

  t09TxDb.activity_logs.insertOne({
    _id: ObjectId(),
    branchId: t09Contribution.branchId,
    targetBranchId: t09Contribution.branchId,
    actorId: ObjectId(),
    actorRole: "ADMIN",
    actorBranchId: t09Contribution.branchId,
    action: "TX_PRACTICE_CONTRIBUTION_REFUNDED",
    entityType: "Contribution",
    entityId: String(t09Contribution._id),
    description: `Practice 09 refund ${t09RunId}`,
    demoBatch: t09RunId,
    createdAt: new Date()
  });

  t09Session.commitTransaction();
  print(`COMMIT OK: ${t09RunId}`);
} catch (err) {
  t09Session.abortTransaction();
  print(`ROLLBACK: ${err.message}`);
  throw err;
} finally {
  t09Session.endSession();
}
```

---

## Bai 10. Validation sai branch va rollback toan bo giao dich

### De bai

Hay mo phong 1 truong hop nhap sai:
- lay campaign cua branch A
- lay beneficiary cua branch B
- neu branch khong khop thi abort transaction
- khong duoc de du lieu sai ton tai

### Loi giai

```javascript
db = db.getSiblingDB("charity_distributed");

var t10RunId = `TX-PRACTICE-10-${Date.now()}`;
var t10Campaign = db.campaigns.findOne({}, { sort: { branchId: 1, code: 1 } });
var t10Beneficiary = db.beneficiaries.findOne({ branchId: { $ne: t10Campaign.branchId } }, { sort: { branchId: 1, createdAt: 1 } });
if (!t10Campaign || !t10Beneficiary) {
  throw new Error("Need at least two branches with data.");
}

var t10BranchMismatch = String(t10Campaign.branchId) !== String(t10Beneficiary.branchId);
var t10Session = db.getMongo().startSession();
var t10TxDb = t10Session.getDatabase("charity_distributed");

try {
  t10Session.startTransaction({ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });

  if (t10BranchMismatch) {
    t10TxDb.activity_logs.insertOne({
      _id: ObjectId(),
      branchId: t10Campaign.branchId,
      targetBranchId: t10Beneficiary.branchId,
      actorId: ObjectId(),
      actorRole: "STAFF",
      actorBranchId: t10Campaign.branchId,
      action: "TX_PRACTICE_INVALID_BRANCH",
      entityType: "Beneficiary",
      entityId: String(t10Beneficiary._id),
      description: "Invalid branch mapping detected during practice 10",
      demoBatch: t10RunId,
      createdAt: new Date()
    });

    throw new Error("Branch mismatch detected. Abort transaction.");
  }

  t10TxDb.aid_distributions.insertOne({
    _id: ObjectId(),
    branchId: t10Campaign.branchId,
    campaignId: t10Campaign._id,
    beneficiaryId: t10Beneficiary._id,
    type: "ITEM",
    status: "PENDING",
    createdBy: ObjectId(),
    demoBatch: t10RunId,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  t10Session.commitTransaction();
  print(`COMMIT OK: ${t10RunId}`);
} catch (err) {
  t10Session.abortTransaction();
  print(`EXPECTED ROLLBACK: ${err.message}`);
} finally {
  t10Session.endSession();
}
```

---

## Ghi nho nhanh khi on tap

- `startTransaction()` dung de gom nhieu ghi nhan lai thanh 1 giao dich.
- `commitTransaction()` luu toan bo thay doi.
- `abortTransaction()` huy toan bo thay doi neu co loi giua chang.
- Khi demo voi project nay, hay uu tien cac collection: `contributions`, `campaigns`, `contributors`, `beneficiaries`, `aid_distributions`, `volunteers`, `activity_logs`.
- Moi lenh trong file nay deu co the copy-paste chay trong `mongosh` sau khi da seed xong.
