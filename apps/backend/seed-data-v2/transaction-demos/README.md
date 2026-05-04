# Transaction Demo Scripts

Thu muc nay chua cac kich ban transaction de demo khi giang vien hoi ve ACID, rollback, audit log, validate nghiep vu va shard routing theo `branchId`.

## Dieu kien truoc khi chay

- Ket noi vao `mongos` tren May 1, khong ket noi truc tiep vao tung shard.
- Cac shard phai la replica set, vi MongoDB transaction can replica set/sharded cluster.
- Da chay cau hinh sharding trong `huong-dan/08-tich-hop-be-fe-6-may.md`.
- Da chay seed trong `apps/backend/seed-data-v2/seeds/index.mongodb`.
- Database su dung la `charity_distributed`.

```javascript
db = db.getSiblingDB("charity_distributed")
```

## 10 kich ban transaction

1. `01-create-money-contribution-transaction.mongodb`
   - Tao contribution tien.
   - Cap nhat `campaigns.currentAmount`.
   - Cap nhat `contributors.totalContributionStats`.
   - Ghi `activity_logs`.

2. `02-complete-aid-distribution-transaction.mongodb`
   - Tao aid distribution da hoan thanh.
   - Cap nhat tien da phan phoi trong campaign.
   - Ghi log phat ho tro.

3. `03-rollback-failure-demo.mongodb`
   - Co tinh update campaign va insert log.
   - Nem loi giua transaction.
   - `abortTransaction()` de chung minh du lieu khong bi lech.

4. `04-create-campaign-with-audit-transaction.mongodb`
   - Tao campaign moi.
   - Tao audit log tuong ung.
   - Demo campaign la aggregate root cua branch.

5. `05-register-beneficiary-transaction.mongodb`
   - Dang ky beneficiary moi.
   - Tang `summaryStats.beneficiaryCount`.
   - Ghi audit log.

6. `06-verify-beneficiary-transaction.mongodb`
   - Chuyen beneficiary tu `PENDING` sang `VERIFIED`.
   - Set `verifiedBy`, `verifiedAt`.
   - Ghi audit log de truy vet.

7. `07-volunteer-join-campaign-transaction.mongodb`
   - Them campaign vao `volunteers.joinedCampaignIds`.
   - Tang `summaryStats.totalVolunteerHours`.
   - Ghi audit log.

8. `08-approve-aid-distribution-transaction.mongodb`
   - Tao hoac tim aid `PENDING`.
   - Chuyen sang `APPROVED`.
   - Set `approvedBy`, `approvedAt`.
   - Ghi audit log.

9. `09-refund-money-contribution-transaction.mongodb`
   - Hoan/huy mot contribution tien da `RECEIVED`.
   - Tru lai campaign amount va contributor stats.
   - Ghi audit log.

10. `10-cross-branch-validation-rollback.mongodb`
    - Co tinh ghep campaign cua branch A voi branch B.
    - Demo validation nghiep vu phai nam o BE/service.
    - Transaction rollback, khong insert du lieu sai.

File phu:

- `11-transaction-demo-checks.mongodb`
  - Khong tao transaction moi.
  - Tap hop cac lenh dem ban ghi demo, xem audit logs, xem shard distribution va config metadata.

## Cac lenh hay dung khi demo

Dem document theo collection:

```javascript
db.campaigns.countDocuments()
db.contributions.countDocuments()
db.aid_distributions.countDocuments()
db.activity_logs.countDocuments()
```

Xem log demo moi nhat:

```javascript
db.activity_logs
  .find({ action: /^TX_DEMO_/ })
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()
```

Kiem tra record theo demo batch:

```javascript
db.contributions.find({ demoBatch: /^TX-DEMO-CONTRIB-/ }).pretty()
db.aid_distributions.find({ demoBatch: /^TX-DEMO-AID-/ }).pretty()
db.campaigns.find({ demoBatch: /^TX-DEMO-CAMPAIGN-/ }).pretty()
```

Kiem tra logical count theo branch qua mongos:

```javascript
db.contributions.aggregate([
  { $group: { _id: "$branchSnapshot.code", count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
])
```

Xem phan bo shard:

```javascript
db.contributions.getShardDistribution()
db.aid_distributions.getShardDistribution()
db.activity_logs.getShardDistribution()
```

Xem zone range metadata:

```javascript
use config
db.tags.find({ ns: /^charity_distributed\./ }).pretty()
db.chunks.find({ ns: "charity_distributed.contributions" }).sort({ min: 1 }).pretty()
use charity_distributed
```

## Y tra loi ngan khi bi hoi

- MongoDB Community khong co database trigger nhu SQL trigger. Du an xu ly trigger nghiep vu trong BE service layer va demo bang transaction trong mongosh.
- Transaction can thiet khi mot nghiep vu ghi nhieu collection: document chinh, summary stats, aggregate root va activity log.
- Neu mot buoc loi, `abortTransaction()` rollback tat ca thay vi de du lieu lech.
- Shard routing dua tren `branchId`; `_id` cua document van co the sinh ngau nhien.
- Validation branch/campaign/beneficiary cung chi nhanh la trach nhiem cua BE, vi MongoDB khong tu hieu rang campaign A phai thuoc branch A neu minh gui payload sai.
