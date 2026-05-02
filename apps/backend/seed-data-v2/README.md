# 📊 MongoDB Seed Data & Common Queries Guide

Thư mục này chứa tất cả dữ liệu mẫu (seed data) và các truy vấn thường dùng cho dự án từ thiện phân tán.

## 📁 Cấu trúc thư mục (Modular Organization)

```
seed-data-v2/
├── seeds/                              # Dữ liệu mẫu để insert vào database
│   ├── index.mongodb                   # 🚀 Load ALL seed files cùng lúc
│   ├── 01-branches.mongodb             # 5 chi nhánh
│   ├── 02-campaigns.mongodb            # 10 chiến dịch từ thiện
│   ├── 03-contributors.mongodb         # 12 người/tổ chức hiến tặng
│   ├── 04-contributions.mongodb        # 20 đóng góp (7 loại khác nhau)
│   ├── 05-beneficiaries.mongodb        # 10 hộ gia đình được hỗ trợ
│   ├── 06-aid-distributions.mongodb    # 15 phiếu phát hành
│   └── 07-activity-logs.mongodb        # 15 logs hoạt động
├── queries/                            # Các truy vấn thường dùng (64+ queries)
│   ├── index.mongodb                   # 🚀 Load ALL query files cùng lúc
│   ├── 01-campaign-queries.mongodb     # 10 truy vấn chiến dịch
│   ├── 02-contributor-queries.mongodb  # 10 truy vấn người hiến tặng
│   ├── 03-contribution-queries.mongodb # 10 truy vấn đóng góp
│   ├── 04-aid-distribution-queries.mongodb  # 10 truy vấn phát hành
│   ├── 05-beneficiary-queries.mongodb  # 10 truy vấn hộ được hỗ trợ
│   ├── 06-branch-queries.mongodb       # 5 truy vấn chi nhánh
│   └── 07-statistics-queries.mongodb   # 8+ truy vấn thống kê & dashboard
└── README.md                           # File này
```

## 🚀 Cách sử dụng

### 1️⃣ Import Seed Data (Dữ liệu mẫu)

#### ⭐ Option A: Dùng index file (RECOMMENDED - Nhanh nhất)
```bash
# Mở mongosh từ thư mục seed-data-v2/
mongosh
use charity_distributed;

# Load tất cả seed files cùng lúc
load('./seeds/index.mongodb');
```

#### Option B: Dùng mongosh shell (tuần tự)
```bash
mongosh
use charity_distributed;

# Import từng file seed (theo thứ tự)
load('./seeds/01-branches.mongodb');
load('./seeds/02-campaigns.mongodb');
load('./seeds/03-contributors.mongodb');
load('./seeds/04-contributions.mongodb');
load('./seeds/05-beneficiaries.mongodb');
load('./seeds/06-aid-distributions.mongodb');
load('./seeds/07-activity-logs.mongodb');
```

#### Option C: Xóa dữ liệu cũ rồi re-import
```bash
mongosh
use charity_distributed;
db.dropDatabase();

# Load seed data
load('./seeds/index.mongodb');
```

### 2️⃣ Chạy Queries (Truy vấn)

#### ⭐ Option A: Load tất cả queries (RECOMMENDED)
```bash
mongosh
use charity_distributed;

# Load tất cả query files
load('./queries/index.mongodb');

# Giờ bạn có thể gọi các query
# Ví dụ:
db.campaigns.find();
db.contributors.find();
```

#### Option B: Load query files riêng lẻ
```bash
mongosh
use charity_distributed;

# Load queries theo category
load('./queries/01-campaign-queries.mongodb');
load('./queries/02-contributor-queries.mongodb');
# ... v.v.
```

#### Option C: Copy query cụ thể
- Mở file query cần (ví dụ: `01-campaign-queries.mongodb`)
- Copy query cần dùng
- Paste vào mongosh hoặc MongoDB Compass

## 📊 Dữ liệu Seed (Tóm tắt)

| Collection | Số docs | Mô tả |
|---|---|---|
| branches | 5 | Chi nhánh (HQ, HCM, DNG, v.v.) |
| campaigns | 10 | Chiến dịch với goals, resources, stats |
| contributors | 12 | Người/tổ chức hiến tặng (3 loại) |
| contributions | 20 | Đóng góp (7 loại: MONEY, ITEM, SERVICE, v.v.) |
| beneficiaries | 10 | Hộ gia đình cần hỗ trợ |
| aid_distributions | 15 | Phát hành trợ cấp (6 trạng thái) |
| activity_logs | 15 | Lịch sử hoạt động (audit trail) |
| **Tổng cộng** | **87** | |

## 🔍 Danh sách Queries (64+ queries)

### Campaign Queries (01-campaign-queries.mongodb) - 10 queries
- Lấy campaigns by branch
- Lấy campaigns đang chạy (active)
- Lấy campaigns có tổng tiền > ngưỡng
- Thống kê campaigns (tổng money, items, tình nguyện viên)
- Top campaigns by money received
- Find pending campaigns
- Campaigns theo date range
- Campaigns sắp deadline
- Campaign efficiency metrics
- Find campaigns by creator/manager

### Contributor Queries (02-contributor-queries.mongodb) - 10 queries
- Lấy contributors by branch
- Lấy contributors by type (INDIVIDUAL/ORGANIZATION/SERVICE_PROVIDER)
- Top contributors by money amount
- Tìm inactive contributors
- Contributors với nhiều đóng góp
- Tìm contributors không có phone
- Search contributors by email/name
- Contributors by province
- Lấy stats của 1 contributor
- Breakdown contributions by type

### Contribution Queries (03-contribution-queries.mongodb) - 10 queries
- Lấy contributions by campaign
- Lấy contributions by status (PENDING/CONFIRMED/RECEIVED)
- Lấy contributions by type (MONEY/ITEM/SERVICE/v.v.)
- Tìm pending contributions
- Tìm contributions > threshold amount
- Contribution timeline
- Tìm recent contributions
- Xác nhận số contributions
- Rejected vs received ratio
- Contribution efficiency metrics

### Aid_Distribution Queries (04-aid-distribution-queries.mongodb) - 10 queries
- Lấy distributions by campaign
- Lấy distributions by status
- Pending distributions (chưa phê duyệt)
- Approved distributions (chờ phát hành)
- Completed distributions
- Distribution timeline
- Distributions của 1 hộ được hỗ trợ
- Distributions chờ proof
- Delivery completion rate
- Distribution efficiency

### Beneficiary Queries (05-beneficiary-queries.mongodb) - 10 queries
- Lấy beneficiaries by branch
- Lấy beneficiaries by priority (HIGH/MEDIUM/LOW)
- Active beneficiaries
- Beneficiaries đã nhận trợ cấp
- Beneficiaries chưa nhận gì
- Beneficiaries by province
- Search by name/ID
- High-priority beneficiaries
- Lịch sử trợ cấp của 1 hộ
- Beneficiary coverage %

### Branch Queries (06-branch-queries.mongodb) - 5 queries
- Lấy tất cả branches
- Branches ACTIVE
- Branches by type (HEADQUARTER/BRANCH)
- Tìm branch by code
- Lấy branches by province

### Statistics & Dashboard Queries (07-statistics-queries.mongodb) - 8+ queries
- **Dashboard Overview**: Total campaigns, money, items, beneficiaries
- **Money Flow**: Tổng tiền nhận vs phát hành
- **Contribution Type Distribution**: Pie chart data
- **Aid Distribution Status**: PENDING vs APPROVED vs COMPLETED
- **Branch Comparison**: So sánh hiệu suất các branches
- **Top Branches**: Branches tốt nhất theo metrics
- **Campaign Efficiency**: Success rate & completion
- **Network Health**: System overview

## 💡 Tips & Tricks

### 1. Kiểm tra dữ liệu seed đã import chưa
```bash
mongosh
use charity_distributed;
db.branches.count();      # Phải là 5
db.campaigns.count();     # Phải là 10
db.contributions.count(); # Phải là 20
```

### 2. Xóa 1 collection cụ thể
```bash
db.contributions.deleteMany({});
```

### 3. Reset database (xóa toàn bộ)
```bash
db.dropDatabase();
```

### 4. Re-import seed data
```bash
# Chạy lại load() commands từ seeds/index.mongodb
load('./seeds/index.mongodb');
```

### 5. Export dữ liệu hiện tại
```bash
mongosh << EOF
use charity_distributed;
db.campaigns.find().forEach(doc => print(JSON.stringify(doc)));
EOF
```

### 6. Import từ JSON file
```bash
mongoimport --db charity_distributed --collection campaigns --file campaigns-backup.json
```

## ⚠️ Lưu ý quan trọng

### ObjectId References
- Seed data dùng `ObjectId()` để tạo random IDs
- Khi import: references giữa collections (campaigns → branchId, contributions → campaignId) phải tương thích
- Nếu lỗi: xóa hết data cũ rồi re-import từ seed files

### Sharding Keys
- Tất cả collections có `branchId` để sharding (hashed)
- Queries thường filter by `branchId` trước để tận dụng shard key

### Snapshot Data
- `contributions` và `aid_distributions` có snapshot fields
- Dùng để audit trail (tracking changes)
- Không được modify sau khi tạo

## 📝 Chuẩn bị cho giáo viên hỏi

### Câu hỏi thường gặp & cách trả lời

**Q1: "Có bao nhiêu campaigns?"**
```bash
db.campaigns.countDocuments();
# Output: 10
```

**Q2: "Tổng tiền các campaigns nhận được là bao nhiêu?"**
```bash
db.campaigns.aggregate([{
  $group: {
    _id: null,
    total: { $sum: "$summaryStats.totalMoneyReceived" }
  }
}]);
```

**Q3: "Top 3 contributors theo số tiền?"**
```bash
db.contributors.find().sort({"totalContributionStats.totalMoneyAmount": -1}).limit(3);
```

**Q4: "Bao nhiêu phần trăm phiếu phát hành đã completed?"**
```bash
db.aid_distributions.aggregate([
  {$group: {_id: "$status", count: {$sum: 1}}},
  {$match: {_id: "COMPLETED"}}
]);
```

**Q5: "Liệt kê beneficiaries chưa nhận trợ cấp nào"**
```bash
// Lấy tất cả beneficiary IDs có aid distributions
// Rồi so sánh với tất cả beneficiaries
db.beneficiaries.find({
  _id: {
    $nin: db.aid_distributions
      .distinct("beneficiaryId")
  }
});
```

## 🆘 Troubleshooting

### Lỗi: "Cannot read property 'insertMany' is not a function"
→ Đảm bảo chạy trong mongosh shell, không phải Node.js console

### Lỗi: "Cannot find ObjectId"
→ Chạy `use charity_distributed;` trước

### Lỗi: "Seed data bị duplicate"
→ Xóa hết rồi re-import:
```bash
db.dropDatabase();
load('./seeds/index.mongodb');
```

### Lỗi: "Connection refused"
→ Kiểm tra MongoDB đang chạy: `mongosh`

### Lỗi: "File not found"
→ Chạy từ thư mục `seed-data-v2/`

## 📞 Hỗ trợ

Nếu có vấn đề:
1. Check file path của seed/query files
2. Verify MongoDB đang chạy: `mongosh`
3. Check database selection: `db`
4. Xem file seed/query code để hiểu ý định
5. Dùng `db.dropDatabase()` để reset nếu cần

### Giáo viên hỏi: "Tổng tiền nhận được là bao nhiêu?"
```javascript
db.campaigns.aggregate([
  { $group: { _id: null, totalMoney: { $sum: "$summaryStats.totalMoneyReceived" } } }
]);
// Kết quả: ~245,000,000 VND
```

### Giáo viên hỏi: "Chi nhánh nào hoạt động tốt nhất?"
```javascript
db.campaigns.aggregate([
  {
    $lookup: {
      from: "branches",
      localField: "branchId",
      foreignField: "_id",
      as: "branch"
    }
  },
  { $unwind: "$branch" },
  {
    $group: {
      _id: "$branch.name",
      totalMoney: { $sum: "$summaryStats.totalMoneyReceived" },
      campaignCount: { $sum: 1 }
    }
  },
  { $sort: { totalMoney: -1 } }
]);
```

### Giáo viên hỏi: "Có bao nhiêu beneficiaries chưa được hỗ trợ?"
```javascript
db.beneficiaries.aggregate([
  {
    $lookup: {
      from: "aid_distributions",
      localField: "_id",
      foreignField: "beneficiaryId",
      as: "aids"
    }
  },
  { $match: { aids: { $size: 0 } } },
  { $count: "unaidedBeneficiaries" }
]);
```

### Giáo viên hỏi: "Loại đóng góp nào có giá trị lớn nhất?"
```javascript
// Xem query 8.5 trong common-queries.mongodb
db.contributions.aggregate([...])
```

## 🔗 Liên kết quan trọng

- [MongoDB Query Documentation](https://docs.mongodb.com/manual/reference/method/db.collection.find/)
- [MongoDB Aggregation Pipeline](https://docs.mongodb.com/manual/reference/operator/aggregation/)
- [Project Database Schema](../Thiết%20kế%20csdl/16-thiet-ke-csdl-mongodb.md)

## ⚙️ Thêm dữ liệu mẫu

Để thêm dữ liệu mẫu cho collection, thêm vào `seed-data.mongodb`:

```javascript
db.campaigns.insertOne({
  name: "Tên chiến dịch mới",
  branchId: db.branches.findOne({code: "HQ"})._id,
  // ... other fields
});
```

## 📝 Ghi chú

- Tất cả dữ liệu đều là mẫu (sample data)
- ObjectId được tạo tự động bằng `ObjectId()`
- Các truy vấn đã sử dụng `$regex` cho searching (case-insensitive)
- Queries sử dụng aggregation pipeline cho tính toán phức tạp
- Hỗ trợ sharding: Các truy vấn đều bao gồm `branchId` (shard key)

---

**Chuẩn bị bởi**: Nhóm phát triển
**Ngày cập nhật**: May 2, 2026
**Phiên bản**: v2.0
