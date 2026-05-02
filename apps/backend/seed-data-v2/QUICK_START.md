# ⚡ Quick Start Guide

Hướng dẫn nhanh nhất để import seed data và chạy queries.

## 🚀 Import Seed Data (30 giây)

```bash
# 1. Mở terminal tại thư mục seed-data-v2/
cd seed-data-v2

# 2. Khởi động mongosh
mongosh

# 3. Trong mongosh, chọn database
use charity_distributed;

# 4. Import tất cả seed data
load('./seeds/index.mongodb');

# ✅ Xong! Dữ liệu đã được import
```

## 🔍 Chạy Queries (30 giây)

```bash
# Từ cùng mongosh shell ở trên:

# 1. Load tất cả queries
load('./queries/index.mongodb');

# 2. Chạy query bất kỳ:
db.campaigns.find();           # Lấy tất cả campaigns
db.contributors.find();        # Lấy tất cả contributors
db.contributions.find();       # Lấy tất cả contributions

# 3. Hoặc chạy truy vấn nâng cao:
db.campaigns.aggregate([
  {$match: {status: "ACTIVE"}},
  {$sort: {createdAt: -1}}
]);
```

## 📊 Kiểm tra dữ liệu

```bash
# Trong mongosh:
db.branches.count();           # Phải là 5
db.campaigns.count();          # Phải là 10
db.contributors.count();       # Phải là 12
db.contributions.count();      # Phải là 20
db.beneficiaries.count();      # Phải là 10
db.aid_distributions.count();  # Phải là 15
db.activity_logs.count();      # Phải là 15
```

## 🔄 Reset Database

```bash
# Xóa tất cả dữ liệu
db.dropDatabase();

# Re-import seed data
load('./seeds/index.mongodb');
```

## 📂 File Structure

```
seeds/
├── index.mongodb           ← Load cái này để import all
├── 01-branches.mongodb
├── 02-campaigns.mongodb
├── 03-contributors.mongodb
├── 04-contributions.mongodb
├── 05-beneficiaries.mongodb
├── 06-aid-distributions.mongodb
└── 07-activity-logs.mongodb

queries/
├── index.mongodb           ← Load cái này để load all queries
├── 01-campaign-queries.mongodb
├── 02-contributor-queries.mongodb
├── 03-contribution-queries.mongodb
├── 04-aid-distribution-queries.mongodb
├── 05-beneficiary-queries.mongodb
├── 06-branch-queries.mongodb
└── 07-statistics-queries.mongodb
```

## ❓ Câu hỏi thường gặp

**Q: Làm sao import dữ liệu?**
```bash
# Step 1-4 ở trên
load('./seeds/index.mongodb');
```

**Q: Làm sao load queries?**
```bash
load('./queries/index.mongodb');
```

**Q: Làm sao xóa hết?**
```bash
db.dropDatabase();
```

**Q: Làm sao chạy query cụ thể?**
```bash
db.campaigns.find();
```

**Q: Có bao nhiêu dữ liệu?**
```bash
# Tổng cộng 87 documents
# branches: 5
# campaigns: 10  
# contributors: 12
# contributions: 20
# beneficiaries: 10
# aid_distributions: 15
# activity_logs: 15
```

---

## 🎯 Common Tasks

### Task 1: Import seed data
```bash
mongosh
use charity_distributed;
load('./seeds/index.mongodb');
```

### Task 2: Find all campaigns
```bash
db.campaigns.find();
```

### Task 3: Find active campaigns
```bash
db.campaigns.find({status: "ACTIVE"});
```

### Task 4: Count contributions by type
```bash
db.contributions.aggregate([
  {$group: {_id: "$type", count: {$sum: 1}}}
]);
```

### Task 5: Get top contributors
```bash
db.contributors.find()
  .sort({"totalContributionStats.totalMoneyAmount": -1})
  .limit(5);
```

### Task 6: Get dashboard stats
```bash
load('./queries/07-statistics-queries.mongodb');
```

---

## 📖 Full Documentation

Xem [README.md](./README.md) để có hướng dẫn đầy đủ (64+ queries, tips, troubleshooting).

---

## ✅ Verification Checklist

- [ ] MongoDB đang chạy
- [ ] Seed data imported (count = 87)
- [ ] Queries có thể chạy
- [ ] Dashboard queries hoạt động
- [ ] ObjectId references chính xác

Xong! Bạn đã sẵn sàng để kiểm thử hệ thống.
