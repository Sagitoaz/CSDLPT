# Transaction Demo Scripts

Thu muc nay chua cac kich ban transaction de demo khi giang vien hoi ve ACID, rollback, idempotency va audit log trong MongoDB Sharded Cluster.

## Dieu kien truoc khi chay

- Ket noi vao `mongos` tren May 1.
- Cac shard la replica set.
- Da chay seed trong `apps/backend/seed-data-v2/seeds/index.mongodb`.
- Database dang dung la `charity_distributed`.

## Kich ban demo nen chay

1. `01-create-money-contribution-transaction.mongodb`
   - Tao contribution tien.
   - Cap nhat `campaigns.currentAmount` va `campaigns.summaryStats.totalMoneyReceived`.
   - Cap nhat `contributors.totalContributionStats`.
   - Ghi `activity_logs`.

2. `02-complete-aid-distribution-transaction.mongodb`
   - Tao aid distribution da hoan thanh.
   - Cap nhat `campaigns.disbursedAmount`, `summaryStats.totalMoneyDistributed`, `summaryStats.totalEstimatedAidValue`.
   - Ghi `activity_logs`.

3. `03-rollback-failure-demo.mongodb`
   - Co tinh update campaign va insert log tam.
   - Nem loi sau khi ghi.
   - Abort transaction va kiem tra du lieu khong doi.

4. `04-transaction-demo-checks.mongodb`
   - Kiem tra record demo va log.
   - In lenh xem shard distribution.

## Y tra loi ngan khi bi hoi

- Transaction can thiet vi mot nghiep vu ghi nhieu collection: document chinh, summaryStats, contributor stats va activity log.
- Neu mot buoc loi, `abortTransaction()` giup rollback tat ca thay vi de du lieu lech.
- Cac demo dung 5 branch du lieu: HP-S1, TH-S2, DN-S3, HCM-S4, BT-S5. Ha Noi chi la may controller/mongos, khong co record branch trong seed.
- `transactionCode` unique sparse dung de tranh ghi trung giao dich tien.
