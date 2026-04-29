# 16 - Thiết kế cơ sở dữ liệu MongoDB cho hệ thống quản lý từ thiện phân tán

Tài liệu này thiết kế cơ sở dữ liệu MongoDB cho dự án hiện tại theo hướng document model, aggregate root, dữ liệu lồng nhau, snapshot lịch sử và phân tán theo chi nhánh/trung tâm. Phạm vi tài liệu chỉ là thiết kế CSDL và kiến trúc dữ liệu, không yêu cầu sửa code backend.

---

## 1. Bối cảnh dự án hiện tại

Qua cấu trúc source code hiện tại, dự án đang là monorepo Node.js:

| Thành phần | Hiện trạng |
|---|---|
| Backend | TypeScript, Express, Mongoose |
| Frontend | Vite, React |
| Database | MongoDB |
| Auth | JWT, RBAC theo vai trò |
| Backend modules | `auth`, `branches`, `campaigns`, `donations`, `donors`, `beneficiaries`, `disbursements`, `volunteers`, `activity-logs`, `stats` |
| Kết nối DB | `MONGODB_URI` qua environment variable |
| Seed hiện có | Super admin, branch admin, staff, donor, branch, campaign, donation, beneficiary, disbursement, volunteer, activity log |

Các collection/model hiện tại đã có nền tảng đúng:

- `branches` quản lý trụ sở/chi nhánh.
- `users` quản lý tài khoản, vai trò, `branchId`.
- `campaigns` có `branchId`, `location`, `images`, `proofImages`, thống kê tiền `currentAmount`, `disbursedAmount`.
- `donations` có `branchId`, `campaignId`, `donorId`, `donorSnapshot`, `campaignSnapshot`.
- `beneficiaries` có `branchId`, `campaignId`, `location`, trạng thái xác minh.
- `disbursements` có `branchId`, `campaignId`, `beneficiaryId`, `proofs`.
- `activity_logs` ghi actor, action, entity, before/after.

Điểm cần cải tổ ở mức thiết kế:

- `donations` hiện mới thể hiện tốt quyên góp tiền, chưa đủ cho hiện vật, thuốc men, sách vở, dịch vụ, giờ công.
- `disbursements` hiện thiên về phát tiền, chưa đủ cho hỗ trợ hiện vật/dịch vụ/hỗn hợp.
- `campaigns` hiện có `targetAmount`, `currentAmount`, `disbursedAmount`; cần mở rộng thành `goals`, `requiredResources`, `summaryStats`.
- `donors` nên được nâng nghĩa thành `contributors` để bao quát cá nhân/tổ chức/người đóng góp dịch vụ/giờ công.
- Cần chuẩn hóa thiết kế shard key, access frequency và branch scope để phù hợp CSDL phân tán.

---

## 2. Mục tiêu thiết kế

Thiết kế MongoDB phải phục vụ đúng bài toán:

> Hệ thống quản lý từ thiện có quản trị tập trung, quản trị theo chi nhánh/trung tâm và hỗ trợ nhiều loại đóng góp.

Nguyên tắc chính:

- Thiết kế theo aggregate/document, không bê nguyên bảng SQL sang collection nhỏ.
- Embed dữ liệu thường đọc cùng nhau và cùng vòng đời.
- Reference dữ liệu có vòng đời độc lập hoặc tăng trưởng lớn.
- Snapshot thông tin lịch sử trong giao dịch đầu vào/đầu ra để giảm `$lookup` và giữ đúng dữ liệu tại thời điểm phát sinh.
- Mọi dữ liệu nghiệp vụ thuộc chi nhánh phải có `branchId`.
- Không dùng `$lookup` như join mặc định; chỉ dùng cho báo cáo tổng hợp hoặc màn hình admin ít tần suất.
- Chuẩn bị cho sharding theo `branchId`, `campaignId` hoặc hashed shard key tùy collection.

---

## 3. Quy ước bảng tần suất truy cập

Dựa theo ký hiệu trong bảng mẫu của đề bài, tài liệu dùng quy ước:

| Ký hiệu | Ý nghĩa |
|---|---|
| `H` | High frequency, tần suất cao |
| `M` | Medium frequency, tần suất trung bình |
| `L` | Low frequency, tần suất thấp |
| `R` | Read, đọc/xem/tìm kiếm |
| `W` | Write, tạo mới |
| `E` | Edit, cập nhật |
| `D` | Delete/Disable/Cancel, xóa mềm, khóa, hủy |

Ví dụ:

- `H.R` nghĩa là đọc tần suất cao.
- `H.WER` nghĩa là tạo, sửa, đọc tần suất cao.
- `L.WED` nghĩa là tạo, sửa, hủy/xóa mềm tần suất thấp.

---

## 4. Bảng tần suất truy cập theo trụ sở chính và chi nhánh

| Thực thể / collection | Trụ sở chính | Các chi nhánh / trung tâm | Ghi chú thiết kế |
|---|---|---|---|
| `branches` | `H.R, L.WED` | `H.R` | Super admin quản lý toàn hệ thống, branch chỉ đọc thông tin của mình |
| `users` | `H.R, M.WED` | `H.R, M.WE` | Branch admin tạo staff trong chi nhánh; không được sửa user branch khác |
| `campaigns` | `H.R, M.WED` | `H.WER, M.D` | Chi nhánh tạo và vận hành chiến dịch của mình |
| `contributors` | `H.R, M.WE` | `H.R, M.WE` | Tìm kiếm người/tổ chức đóng góp, cập nhật thống kê tổng |
| `contributions` | `H.WERD` | `H.WERD` | Collection tăng nhanh nhất ở đầu vào, cần shard/index tốt |
| `beneficiaries` | `H.R, M.WE` | `H.WER, M.D` | Chi nhánh xác minh người/đơn vị nhận hỗ trợ |
| `aid_distributions` | `H.R, M.WED` | `H.WERD` | Collection đầu ra, phải kiểm soát nguồn lực và audit |
| `volunteers` | `M.R, L.WE` | `H.WER` | Chi nhánh quản lý kỹ năng, lịch rảnh, gán campaign |
| `activity_logs` | `H.R` | `H.R, L.W` | Ghi tự động, đọc theo entity/branch/thời gian |
| `stats_snapshots` | `H.R, M.W` | `H.R, M.W` | Khuyến nghị mở rộng để dashboard nhanh hơn |

Kết luận từ bảng tần suất:

- `contributions`, `aid_distributions`, `activity_logs` là nhóm tăng trưởng nhanh nhất.
- `campaigns` là aggregate root trung tâm cho truy vấn người dùng và dashboard.
- `branchId` là trục phân quyền, lọc dữ liệu, index và sharding quan trọng nhất.
- Trụ sở chính đọc toàn hệ thống nhiều hơn ghi; chi nhánh ghi dữ liệu nghiệp vụ thường xuyên hơn.

---

## 5. Kiến trúc phân tán đề xuất

Mô hình đề xuất theo yêu cầu: một cụm máy chủ trung tâm quản lý toàn bộ database logic, phía dưới có 4 shard lưu dữ liệu vật lý. Mỗi shard chứa xấp xỉ 1/4 lượng chunk của database cha theo shard key.

```text
                    +--------------------------------------+
                    |      CUM MAY CHU TRUNG TAM           |
                    |--------------------------------------|
                    |  Backend API                         |
                    |  mongos router                       |
                    |  config server replica set           |
                    |  logical database: charity_distributed|
                    +-------------------+------------------+
                                        |
                      MongoDB sharding routing metadata
                                        |
        +-------------------------------+-------------------------------+
        |                               |                               |
+-------v--------+             +--------v-------+              +--------v-------+
| Shard 01       |             | Shard 02       |              | Shard 03       |
| ~25% chunks    |             | ~25% chunks    |              | ~25% chunks    |
| replica set    |             | replica set    |              | replica set    |
+-------+--------+             +--------+-------+              +--------+-------+
        |                               |                               |
        +-------------------------------+-------------------------------+
                                        |
                                +-------v--------+
                                | Shard 04       |
                                | ~25% chunks    |
                                | replica set    |
                                +----------------+
```

Lưu ý quan trọng:

- "DB trung tâm lưu tất cả DB" nên hiểu là namespace logic và metadata tập trung qua `mongos`/config server.
- Dữ liệu nghiệp vụ thực tế không nhân bản đầy đủ sang cả 4 shard; MongoDB chia dữ liệu thành chunk và phân bổ mỗi shard khoảng 1/4.
- Mỗi shard nên là replica set để có failover nội bộ.
- Config server không lưu document nghiệp vụ chính, chỉ lưu metadata sharding.
- Không dùng riêng `createdAt` làm shard key vì dễ gây hot shard do giá trị tăng dần.

---

## 6. Collection tổng quan

| Collection | Vai trò | Aggregate root | Tăng trưởng | Shard đề xuất |
|---|---|---:|---:|---|
| `branches` | Trụ sở, chi nhánh, trung tâm | Có | Thấp | Không cần shard |
| `users` | Tài khoản, vai trò, permission | Có | Trung bình | Chưa cần shard |
| `campaigns` | Chiến dịch từ thiện | Có | Trung bình | `branchId` hoặc `{ branchId, status }` |
| `contributors` | Người/tổ chức đóng góp | Có | Trung bình | Chưa cần shard, có thể shard theo hashed `_id` khi rất lớn |
| `contributions` | Nguồn lực đầu vào | Có | Rất cao | `branchId` hashed hoặc `campaignId` hashed |
| `beneficiaries` | Người/đơn vị nhận hỗ trợ | Có | Cao | `branchId` hoặc `campaignId` |
| `aid_distributions` | Nguồn lực đầu ra | Có | Cao | `branchId` hashed hoặc `campaignId` hashed |
| `volunteers` | Hồ sơ tình nguyện viên | Có | Trung bình | `branchId` khi lớn |
| `activity_logs` | Nhật ký kiểm soát | Có | Rất cao | `{ branchId, createdAt }` hoặc `branchId` hashed |
| `stats_snapshots` | Snapshot thống kê dashboard | Có | Trung bình | `branchId` hoặc `scopeKey` hashed |

---

## 7. Sơ đồ aggregate/document model

```text
branches
  |- location {}
  |- contact {}

users
  |- branchId -> branches._id
  |- permissions []
  |- profile {}

campaigns
  |- branchId -> branches._id
  |- location {}
  |- timeRange {}
  |- goals {}
  |- requiredResources []
  |- summaryStats {}
  |- images []
  |- documents []

contributors
  |- userId -> users._id optional
  |- address {}
  |- totalContributionStats {}

contributions
  |- branchId -> branches._id
  |- campaignId -> campaigns._id
  |- contributorId -> contributors._id
  |- contributorSnapshot {}
  |- campaignSnapshot {}
  |- branchSnapshot {}
  |- moneyDetail {}
  |- itemDetails []
  |- serviceDetail {}
  |- volunteerWorkDetail {}
  |- proofs []

beneficiaries
  |- branchId -> branches._id
  |- campaignId -> campaigns._id
  |- address {}
  |- needs []
  |- verification {}
  |- documents []

aid_distributions
  |- branchId -> branches._id
  |- campaignId -> campaigns._id
  |- beneficiaryId -> beneficiaries._id
  |- beneficiarySnapshot {}
  |- campaignSnapshot {}
  |- branchSnapshot {}
  |- moneySupport {}
  |- itemSupports []
  |- serviceSupport {}
  |- proofs []

volunteers
  |- branchId -> branches._id
  |- userId -> users._id optional
  |- skills []
  |- availability []
  |- assignedCampaignIds []
  |- stats {}

activity_logs
  |- branchId -> branches._id
  |- actor {}
  |- entity {}
  |- metadata {}
  |- before {}
  |- after {}
```

Thiết kế này không tách quá nhỏ các bảng con như `campaign_images`, `contribution_items`, `proof_files`, `beneficiary_needs`. Những phần đó được embed vì thường đọc cùng document cha và không có vòng đời độc lập mạnh.

---

## 8. Thiết kế chi tiết collection

### 8.1 `branches`

Ý nghĩa: lưu trụ sở chính, chi nhánh, trung tâm vùng.

```javascript
{
  _id: ObjectId,
  code: "HCM",
  name: "Chi nhánh TP.HCM",
  type: "BRANCH", // HEADQUARTER, BRANCH, REGIONAL_CENTER
  parentId: ObjectId | null,
  location: {
    province: "TP.HCM",
    district: "Thủ Đức",
    ward: "Linh Trung",
    address: "..."
  },
  contact: {
    phone: "0900000000",
    email: "hcm@charity.local"
  },
  status: "ACTIVE", // ACTIVE, INACTIVE, LOCKED
  createdAt: ISODate,
  updatedAt: ISODate
}
```

Embed:

- `location`
- `contact`

Index:

```javascript
db.branches.createIndex({ code: 1 }, { unique: true })
db.branches.createIndex({ status: 1 })
db.branches.createIndex({ "location.province": 1 })
```

Không cần shard vì số lượng chi nhánh nhỏ.

### 8.2 `users`

Ý nghĩa: lưu tài khoản đăng nhập và phân quyền.

```javascript
{
  _id: ObjectId,
  fullName: "Nguyen Van A",
  email: "a@example.com",
  phone: "0900000001",
  passwordHash: "...",
  role: "BRANCH_ADMIN", // SUPER_ADMIN, BRANCH_ADMIN, STAFF, CONTRIBUTOR, VOLUNTEER
  branchId: ObjectId | null,
  permissions: ["campaign:create", "contribution:confirm"],
  status: "ACTIVE", // ACTIVE, LOCKED, DISABLED
  profile: {
    avatarUrl: "...",
    title: "Branch Manager"
  },
  lastLoginAt: ISODate,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

Nguyên tắc:

- Không trả `passwordHash` ra response.
- `SUPER_ADMIN` có thể không bị giới hạn bởi `branchId`.
- `BRANCH_ADMIN` và `STAFF` bắt buộc có `branchId`.
- `permissions` dùng để giới hạn quyền chi tiết cho staff.

Index:

```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 }, { sparse: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ branchId: 1, role: 1 })
db.users.createIndex({ status: 1 })
```

### 8.3 `campaigns`

Ý nghĩa: aggregate root của chiến dịch từ thiện.

```javascript
{
  _id: ObjectId,
  branchId: ObjectId,
  code: "HCM-FLOOD-2026",
  title: "Cứu trợ lũ lụt TP.HCM",
  description: "...",
  type: "FLOOD_RELIEF",
  status: "ACTIVE",
  visibility: "PUBLIC",
  location: {
    province: "TP.HCM",
    district: "Thủ Đức",
    ward: "Linh Trung",
    address: "..."
  },
  timeRange: {
    startDate: ISODate,
    endDate: ISODate
  },
  goals: {
    targetMoneyAmount: 100000000,
    targetItemSummary: [
      { name: "Gạo", quantity: 1000, unit: "kg" }
    ],
    targetVolunteerCount: 50
  },
  requiredResources: [
    {
      resourceType: "MONEY",
      name: "Tiền mặt",
      quantity: 100000000,
      unit: "VND",
      estimatedValue: 100000000,
      note: "Chi phí cứu trợ khẩn cấp"
    },
    {
      resourceType: "MEDICINE",
      name: "Thuốc cảm",
      quantity: 500,
      unit: "hộp",
      estimatedValue: 15000000
    }
  ],
  summaryStats: {
    totalMoneyReceived: 0,
    totalEstimatedItemValue: 0,
    totalItemsReceived: 0,
    totalVolunteerHours: 0,
    totalMoneyDistributed: 0,
    totalEstimatedAidValue: 0,
    beneficiaryCount: 0
  },
  images: [
    { url: "...", caption: "Ảnh khu vực hỗ trợ" }
  ],
  documents: [
    { url: "...", name: "Quyết định triển khai", type: "PDF" }
  ],
  createdBy: ObjectId,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

Embed:

- `location`
- `timeRange`
- `goals`
- `requiredResources`
- `summaryStats`
- `images`
- `documents`

Reference:

- `branchId`
- `createdBy`

Index:

```javascript
db.campaigns.createIndex({ code: 1 }, { unique: true })
db.campaigns.createIndex({ branchId: 1, status: 1, createdAt: -1 })
db.campaigns.createIndex({ branchId: 1, type: 1, createdAt: -1 })
db.campaigns.createIndex({ visibility: 1, status: 1, createdAt: -1 })
db.campaigns.createIndex({ "location.province": 1, status: 1 })
```

### 8.4 `contributors`

Ý nghĩa: thay thế cách hiểu hẹp `donors`, bao gồm cá nhân, tổ chức, người đóng góp hiện vật, dịch vụ hoặc giờ công.

```javascript
{
  _id: ObjectId,
  type: "INDIVIDUAL", // INDIVIDUAL, ORGANIZATION
  fullName: "Nguyen Van Hao",
  organizationName: null,
  phone: "0900000001",
  email: "hao@example.com",
  address: {
    province: "TP.HCM",
    district: "Thủ Đức",
    detail: "..."
  },
  identityInfo: {
    type: "OPTIONAL_MASKED",
    last4: "1234"
  },
  totalContributionStats: {
    totalMoney: 2500000,
    totalEstimatedItemValue: 0,
    totalVolunteerHours: 0,
    contributionCount: 1
  },
  userId: ObjectId | null,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

Index:

```javascript
db.contributors.createIndex({ phone: 1 }, { sparse: true })
db.contributors.createIndex({ email: 1 }, { sparse: true })
db.contributors.createIndex({ type: 1 })
db.contributors.createIndex({ userId: 1 }, { sparse: true })
db.contributors.createIndex({ fullName: "text", organizationName: "text", email: "text", phone: "text" })
```

### 8.5 `contributions`

Ý nghĩa: nguồn lực đầu vào. Đây là collection quan trọng nhất, thay thế tư duy `donation = money`.

```javascript
{
  _id: ObjectId,
  branchId: ObjectId,
  campaignId: ObjectId,
  contributorId: ObjectId,
  type: "ITEM", // MONEY, ITEM, MEDICINE, CLOTHES, BOOK, SERVICE, VOLUNTEER_WORK, OTHER
  status: "RECEIVED", // PENDING, CONFIRMED, RECEIVED, CANCELLED, REJECTED, REFUNDED
  contributorSnapshot: {
    fullName: "Nguyen Van Hao",
    organizationName: null,
    phone: "0900000001",
    email: "hao@example.com",
    type: "INDIVIDUAL"
  },
  campaignSnapshot: {
    code: "HCM-FLOOD-2026",
    title: "Cứu trợ lũ lụt TP.HCM"
  },
  branchSnapshot: {
    code: "HCM",
    name: "Chi nhánh TP.HCM"
  },
  moneyDetail: null,
  itemDetails: [
    {
      name: "Gạo",
      category: "FOOD",
      quantity: 100,
      unit: "kg",
      condition: "NEW",
      estimatedValue: 1800000,
      note: "Đóng bao 5kg"
    }
  ],
  serviceDetail: null,
  volunteerWorkDetail: null,
  proofs: [
    {
      type: "IMAGE",
      url: "https://...",
      description: "Ảnh tiếp nhận",
      uploadedAt: ISODate,
      uploadedBy: ObjectId
    }
  ],
  receivedAt: ISODate,
  createdBy: ObjectId,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

Ví dụ quyên góp tiền:

```javascript
{
  type: "MONEY",
  moneyDetail: {
    amount: 2500000,
    currency: "VND",
    paymentMethod: "BANK_TRANSFER",
    paymentStatus: "SUCCESS",
    transactionCode: "TXN-HCM-001",
    paidAt: ISODate
  }
}
```

Ví dụ đóng góp giờ công:

```javascript
{
  type: "VOLUNTEER_WORK",
  volunteerWorkDetail: {
    skill: "medical-support",
    hours: 6,
    workDate: ISODate,
    description: "Hỗ trợ phân loại thuốc"
  }
}
```

Validation bắt buộc:

- `type = MONEY`: `moneyDetail.amount > 0`.
- `type = ITEM/MEDICINE/CLOTHES/BOOK`: `itemDetails` có ít nhất 1 item, mỗi item `quantity > 0`.
- `type = SERVICE`: `serviceDetail` bắt buộc, `estimatedHours > 0` nếu có giờ.
- `type = VOLUNTEER_WORK`: `volunteerWorkDetail.hours > 0`.
- Không cộng `summaryStats` nếu status không chuyển mới sang `CONFIRMED` hoặc `RECEIVED`.
- `moneyDetail.transactionCode` phải unique/sparse để idempotency cho thanh toán.

Index:

```javascript
db.contributions.createIndex({ branchId: 1, campaignId: 1, createdAt: -1 })
db.contributions.createIndex({ campaignId: 1, status: 1, createdAt: -1 })
db.contributions.createIndex({ contributorId: 1, createdAt: -1 })
db.contributions.createIndex({ branchId: 1, type: 1, status: 1, createdAt: -1 })
db.contributions.createIndex({ "moneyDetail.transactionCode": 1 }, { unique: true, sparse: true })
```

Shard đề xuất:

- Nếu truy vấn chính là admin chi nhánh: `{ branchId: "hashed" }`.
- Nếu truy vấn chính là theo chiến dịch: `{ campaignId: "hashed" }`.
- Nếu một chiến dịch quá lớn, cân nhắc bucket theo thời gian: `{ campaignId: 1, createdMonth: 1 }`.

### 8.6 `beneficiaries`

Ý nghĩa: người, hộ gia đình, tổ chức hoặc cộng đồng nhận hỗ trợ.

```javascript
{
  _id: ObjectId,
  branchId: ObjectId,
  campaignId: ObjectId,
  type: "FAMILY",
  name: "Hộ gia đình Trần",
  phone: "0901231234",
  address: {
    province: "TP.HCM",
    district: "Thủ Đức",
    ward: "Linh Trung",
    detail: "..."
  },
  situationDescription: "Bị ảnh hưởng bởi ngập lụt",
  needs: [
    {
      resourceType: "FOOD",
      name: "Gạo",
      quantity: 50,
      unit: "kg",
      estimatedValue: 900000,
      note: "Nhu cầu khẩn cấp 2 tuần"
    }
  ],
  verification: {
    status: "VERIFIED",
    verifiedBy: ObjectId,
    verifiedAt: ISODate,
    note: "Đã xác minh tại địa phương"
  },
  documents: [
    { type: "IMAGE", url: "...", description: "Giấy xác nhận" }
  ],
  createdAt: ISODate,
  updatedAt: ISODate
}
```

Index:

```javascript
db.beneficiaries.createIndex({ branchId: 1, campaignId: 1, "verification.status": 1 })
db.beneficiaries.createIndex({ "address.province": 1 })
db.beneficiaries.createIndex({ name: "text", phone: "text" })
```

### 8.7 `aid_distributions`

Ý nghĩa: nguồn lực đầu ra, bao gồm phát tiền, trao hàng, trao thuốc, hỗ trợ dịch vụ hoặc hỗn hợp.

```javascript
{
  _id: ObjectId,
  branchId: ObjectId,
  campaignId: ObjectId,
  beneficiaryId: ObjectId,
  type: "MIXED", // MONEY, ITEM, MEDICINE, CLOTHES, BOOK, SERVICE, MIXED, OTHER
  status: "COMPLETED", // PLANNED, APPROVED, DELIVERED, COMPLETED, CANCELLED, REJECTED
  beneficiarySnapshot: {
    name: "Hộ gia đình Trần",
    type: "FAMILY",
    phone: "0901231234",
    addressSummary: "Linh Trung, Thủ Đức, TP.HCM"
  },
  campaignSnapshot: {
    code: "HCM-FLOOD-2026",
    title: "Cứu trợ lũ lụt TP.HCM"
  },
  branchSnapshot: {
    code: "HCM",
    name: "Chi nhánh TP.HCM"
  },
  moneySupport: {
    amount: 1000000,
    currency: "VND",
    method: "CASH"
  },
  itemSupports: [
    {
      name: "Gạo",
      category: "FOOD",
      quantity: 20,
      unit: "kg",
      estimatedValue: 360000,
      note: "Trao trực tiếp"
    }
  ],
  serviceSupport: null,
  proofs: [
    {
      type: "IMAGE",
      url: "https://...",
      description: "Ảnh bàn giao",
      uploadedAt: ISODate,
      uploadedBy: ObjectId
    }
  ],
  approvedBy: ObjectId,
  approvedAt: ISODate,
  deliveredAt: ISODate,
  completedAt: ISODate,
  createdBy: ObjectId,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

Validation:

- `type = MONEY`: `moneySupport.amount > 0`.
- `type = ITEM/MEDICINE/CLOTHES/BOOK/MIXED`: `itemSupports` phải hợp lệ.
- `type = SERVICE`: `serviceSupport` bắt buộc.
- Không cho `COMPLETED` nếu vượt nguồn lực khả dụng, nếu hệ thống bật kiểm soát tồn nguồn lực.
- Mọi thao tác `APPROVED`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `REJECTED` phải ghi `activity_logs`.

Index:

```javascript
db.aid_distributions.createIndex({ branchId: 1, campaignId: 1, status: 1, createdAt: -1 })
db.aid_distributions.createIndex({ branchId: 1, beneficiaryId: 1, status: 1 })
db.aid_distributions.createIndex({ campaignId: 1, completedAt: -1 })
db.aid_distributions.createIndex({ branchId: 1, type: 1, status: 1 })
```

### 8.8 `volunteers`

```javascript
{
  _id: ObjectId,
  branchId: ObjectId,
  userId: ObjectId | null,
  fullName: "Le Thi Minh",
  phone: "0903123123",
  email: "volunteer@example.com",
  skills: ["logistics", "medical-support"],
  availability: [
    { dayOfWeek: "SATURDAY", timeRange: "08:00-17:00" }
  ],
  assignedCampaignIds: [ObjectId],
  stats: {
    totalHours: 24,
    completedActivities: 4
  },
  status: "ACTIVE",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

Index:

```javascript
db.volunteers.createIndex({ branchId: 1, status: 1 })
db.volunteers.createIndex({ branchId: 1, skills: 1 })
db.volunteers.createIndex({ userId: 1 }, { sparse: true })
```

### 8.9 `activity_logs`

```javascript
{
  _id: ObjectId,
  branchId: ObjectId | null,
  actor: {
    actorId: ObjectId,
    role: "BRANCH_ADMIN",
    branchId: ObjectId,
    fullName: "HCM Branch Admin"
  },
  action: "CONTRIBUTION_CONFIRMED",
  entity: {
    entityType: "contribution",
    entityId: ObjectId
  },
  description: "Contribution moved PENDING -> RECEIVED",
  metadata: {
    requestId: "...",
    source: "admin-api"
  },
  before: {},
  after: {},
  ipAddress: "127.0.0.1",
  userAgent: "...",
  createdAt: ISODate
}
```

Index:

```javascript
db.activity_logs.createIndex({ branchId: 1, createdAt: -1 })
db.activity_logs.createIndex({ "entity.entityType": 1, "entity.entityId": 1, createdAt: -1 })
db.activity_logs.createIndex({ "actor.actorId": 1, createdAt: -1 })
```

Shard đề xuất:

- `{ branchId: "hashed" }` nếu truy vấn chủ yếu theo chi nhánh.
- `{ branchId: 1, createdAt: 1 }` nếu muốn truy vấn range theo thời gian trong từng chi nhánh.
- Tránh chỉ dùng `{ createdAt: 1 }`.

---

## 9. Embedded, reference và snapshot

### 9.1 Embedded document

| Collection | Embedded field | Lý do |
|---|---|---|
| `branches` | `location`, `contact` | Đọc cùng branch, không có vòng đời riêng |
| `campaigns` | `location`, `goals`, `requiredResources`, `summaryStats`, `images`, `documents` | Chiến dịch là aggregate root; các phần này thường hiển thị cùng campaign |
| `contributions` | `moneyDetail`, `itemDetails`, `serviceDetail`, `volunteerWorkDetail`, `proofs` | Chi tiết đóng góp thuộc vòng đời contribution |
| `beneficiaries` | `address`, `needs`, `verification`, `documents` | Dữ liệu mô tả người nhận, thường đọc cùng hồ sơ |
| `aid_distributions` | `moneySupport`, `itemSupports`, `serviceSupport`, `proofs` | Chi tiết hỗ trợ thuộc vòng đời lần hỗ trợ |
| `volunteers` | `skills`, `availability`, `stats` | Thông tin hồ sơ tình nguyện viên |
| `activity_logs` | `actor`, `entity`, `metadata`, `before`, `after` | Log phải tự đủ ngữ cảnh, hạn chế lookup |

### 9.2 Reference

| Reference | Lý do |
|---|---|
| `campaigns.branchId -> branches._id` | Branch có vòng đời riêng, phục vụ phân quyền và sharding |
| `users.branchId -> branches._id` | User thuộc chi nhánh |
| `contributions.branchId -> branches._id` | Lọc scope, dashboard, shard |
| `contributions.campaignId -> campaigns._id` | Contribution thuộc campaign |
| `contributions.contributorId -> contributors._id` | Contributor có hồ sơ độc lập |
| `beneficiaries.campaignId -> campaigns._id` | Người nhận theo chiến dịch |
| `aid_distributions.beneficiaryId -> beneficiaries._id` | Lần hỗ trợ tham chiếu hồ sơ người nhận |
| `volunteers.userId -> users._id` | Volunteer có thể có tài khoản đăng nhập |

### 9.3 Snapshot lịch sử

| Collection | Snapshot | Mục đích |
|---|---|---|
| `contributions` | `contributorSnapshot` | Giữ tên, điện thoại, email, loại contributor tại thời điểm đóng góp |
| `contributions` | `campaignSnapshot` | Giữ mã/tên chiến dịch tại thời điểm đóng góp |
| `contributions` | `branchSnapshot` | Báo cáo lịch sử không lệ thuộc đổi tên chi nhánh |
| `aid_distributions` | `beneficiarySnapshot` | Giữ đúng người nhận tại thời điểm hỗ trợ |
| `aid_distributions` | `campaignSnapshot` | Giữ đúng chiến dịch tại thời điểm hỗ trợ |
| `aid_distributions` | `branchSnapshot` | Phục vụ audit và báo cáo |
| `activity_logs` | `actor`, `before`, `after` | Truy vết thao tác mà không cần join |

Snapshot là điểm quan trọng giúp MongoDB phát huy thế mạnh document: một document giao dịch đủ thông tin để hiển thị lịch sử mà không phải lookup liên tục.

---

## 10. Luồng cập nhật nguồn lực đầu vào

```text
Frontend/Admin/API
  |
  | 1. Create contribution request
  v
Backend Service
  |
  | 2. Validate type-specific detail
  | 3. Check campaign exists and branch scope
  | 4. Load contributor/campaign/branch minimal fields
  | 5. Build snapshots
  v
MongoDB transaction/session if available
  |
  | 6. Insert contributions
  | 7. If status becomes CONFIRMED/RECEIVED, update campaigns.summaryStats
  | 8. Update contributors.totalContributionStats
  | 9. Insert activity_logs
  v
Commit
```

Quy tắc chống cộng lặp:

- Chỉ cộng summary khi trạng thái chuyển từ nhóm chưa ghi nhận sang nhóm đã ghi nhận.
- Nếu API gọi lại với cùng trạng thái, trả document hiện tại, không cộng lại.
- `transactionCode` unique/sparse cho quyên góp tiền.
- Khi rollback/refund/cancel từ trạng thái đã ghi nhận, trừ đúng delta đã cộng.

Delta đề xuất:

| Chuyển trạng thái | Tác động summary |
|---|---|
| `PENDING -> CONFIRMED/RECEIVED` | Cộng nguồn lực |
| `CONFIRMED -> RECEIVED` | Không cộng lại nếu đã cộng ở `CONFIRMED` |
| `RECEIVED -> CANCELLED/REFUNDED` | Trừ nguồn lực |
| `PENDING -> REJECTED` | Không cộng/trừ |
| Giữ nguyên trạng thái | Không cộng/trừ |

---

## 11. Luồng cập nhật nguồn lực đầu ra

```text
Branch Admin/Staff
  |
  | 1. Create aid distribution plan
  v
Backend Service
  |
  | 2. Check branch scope
  | 3. Validate beneficiary and campaign
  | 4. Check available resources if enabled
  | 5. Build beneficiary/campaign/branch snapshots
  v
MongoDB transaction/session if available
  |
  | 6. Insert/Update aid_distributions
  | 7. On COMPLETED, update campaigns.summaryStats
  | 8. Update beneficiaryCount if first completed support
  | 9. Insert activity_logs
  v
Commit
```

Quy tắc:

- `APPROVED` ghi `approvedBy`, `approvedAt`.
- `DELIVERED` ghi `deliveredAt`.
- `COMPLETED` ghi `completedAt` và cập nhật summary.
- Không cho `COMPLETED` lặp làm cộng lại `totalMoneyDistributed` hoặc `totalEstimatedAidValue`.
- Không xóa cứng dữ liệu tài chính/lịch sử; dùng `CANCELLED` hoặc `REJECTED`.

---

## 12. Mô hình phân quyền và branch scope

| Vai trò | Phạm vi dữ liệu | Quyền chính |
|---|---|---|
| `SUPER_ADMIN` | Toàn hệ thống | Quản lý branch, user admin, xem dashboard toàn hệ thống, audit toàn hệ thống |
| `BRANCH_ADMIN` | Chỉ `branchId` của mình | Quản lý campaign, staff, contributor, contribution, beneficiary, aid distribution của chi nhánh |
| `STAFF` | Chỉ `branchId` của mình | Thao tác nghiệp vụ theo permission được cấp |
| `CONTRIBUTOR/DONOR` | Public campaign và dữ liệu của chính mình | Tạo contribution, xem lịch sử cá nhân |
| `VOLUNTEER` | Public campaign và hồ sơ của mình | Đăng ký hỗ trợ, cập nhật kỹ năng/lịch rảnh |

Backend phải enforce:

```text
if user.role == SUPER_ADMIN:
    filter = {}
else if user.role in [BRANCH_ADMIN, STAFF]:
    filter = { branchId: currentUser.branchId }
else:
    filter = public data OR own data only
```

Quy tắc update/delete:

- Luôn đọc document hiện tại trước.
- Kiểm tra `document.branchId == currentUser.branchId`, trừ `SUPER_ADMIN`.
- Sai scope trả `403 Forbidden`.
- Không đặt logic branch filter rải rác trong controller; dùng middleware/helper/service dùng chung.

---

## 13. Index theo use case

| Use case | Collection | Index đề xuất | Lý do |
|---|---|---|---|
| Public xem campaign đang hoạt động | `campaigns` | `{ visibility: 1, status: 1, createdAt: -1 }` | Lọc `PUBLIC/ACTIVE`, sort mới nhất |
| Branch admin xem campaign của chi nhánh | `campaigns` | `{ branchId: 1, status: 1, createdAt: -1 }` | Target query theo branch |
| Dashboard campaign theo loại | `campaigns` | `{ branchId: 1, type: 1, createdAt: -1 }` | Báo cáo chiến dịch theo loại |
| Admin xem contribution theo campaign | `contributions` | `{ branchId: 1, campaignId: 1, createdAt: -1 }` | Query thường xuyên nhất ở branch |
| Duyệt contribution pending | `contributions` | `{ campaignId: 1, status: 1, createdAt: -1 }` | Lọc hàng chờ xác nhận |
| Contributor xem lịch sử | `contributions` | `{ contributorId: 1, createdAt: -1 }` | Lịch sử cá nhân |
| Chống giao dịch tiền trùng | `contributions` | `{ "moneyDetail.transactionCode": 1 } unique sparse` | Idempotency |
| Tìm beneficiary theo campaign | `beneficiaries` | `{ branchId: 1, campaignId: 1, "verification.status": 1 }` | Chi nhánh xác minh người nhận |
| Xem hỗ trợ theo người nhận | `aid_distributions` | `{ branchId: 1, beneficiaryId: 1, status: 1 }` | Lịch sử hỗ trợ một beneficiary |
| Báo cáo đầu ra theo campaign | `aid_distributions` | `{ campaignId: 1, completedAt: -1 }` | Tổng hợp hỗ trợ đã hoàn tất |
| Log theo entity | `activity_logs` | `{ "entity.entityType": 1, "entity.entityId": 1, createdAt: -1 }` | Mở lịch sử thao tác của một document |
| Log theo chi nhánh | `activity_logs` | `{ branchId: 1, createdAt: -1 }` | Audit branch |

---

## 14. Sharding strategy với 4 shard

### 14.1 Phân bổ logic 1/4 dữ liệu

MongoDB chia collection sharded thành nhiều chunk. Với 4 shard, balancer sẽ cố phân bổ chunk tương đối đều:

| Shard | Vai trò | Dữ liệu mong muốn |
|---|---|---|
| `shard01` | Lưu chunk nhóm 1 | Khoảng 25% dữ liệu sharded |
| `shard02` | Lưu chunk nhóm 2 | Khoảng 25% dữ liệu sharded |
| `shard03` | Lưu chunk nhóm 3 | Khoảng 25% dữ liệu sharded |
| `shard04` | Lưu chunk nhóm 4 | Khoảng 25% dữ liệu sharded |

Nếu dùng hashed shard key:

```text
hash(shardKey) -> hash space -> chunks -> shard01/shard02/shard03/shard04
```

Ưu điểm:

- Dữ liệu phân phối đều hơn.
- Giảm hot shard khi có nhiều ghi.
- Phù hợp demo 4 shard.

Nhược điểm:

- Một số range query không target tốt bằng shard key dạng range.
- Nếu truy vấn không chứa shard key, query có thể scatter-gather qua nhiều shard.

### 14.2 Shard key đề xuất theo collection

| Collection | Shard key đề xuất | Khi dùng | Ưu điểm | Rủi ro |
|---|---|---|---|---|
| `campaigns` | `{ branchId: "hashed" }` | Số campaign rất lớn, quản trị theo branch là chính | Chia đều theo chi nhánh | Query theo status toàn hệ thống cần qua nhiều shard |
| `contributions` | `{ branchId: "hashed" }` | Branch admin là query chính | Phân quyền và route theo branch tốt | Một branch quá lớn vẫn có thể nặng |
| `contributions` | `{ campaignId: "hashed" }` | Campaign là query chính | Chia đều contribution theo campaign | Một campaign cực lớn có thể tạo điểm nóng logic |
| `aid_distributions` | `{ branchId: "hashed" }` | Quản lý đầu ra theo chi nhánh | Phù hợp branch scope | Báo cáo toàn hệ thống phải aggregate nhiều shard |
| `activity_logs` | `{ branchId: "hashed" }` | Audit theo chi nhánh | Phân phối đều hơn `createdAt` | Query theo khoảng thời gian toàn hệ thống scatter |
| `activity_logs` | `{ branchId: 1, createdAt: 1 }` | Cần range thời gian trong branch | Target tốt theo branch + time | Branch lớn có thể tạo chunk lớn |

Khuyến nghị cho bài báo cáo:

- Shard chính: `contributions`, `aid_distributions`, `activity_logs`.
- Shard key demo dễ giải thích: `{ branchId: "hashed" }`.
- Nếu nhóm muốn nhấn mạnh chiến dịch là trục nghiệp vụ: dùng `{ campaignId: "hashed" }` cho `contributions`.
- Không shard `branches`; chưa cần shard `users` và `contributors` ở bản demo.

Lệnh minh họa:

```javascript
sh.enableSharding("charity_distributed")

db.contributions.createIndex({ branchId: "hashed" })
sh.shardCollection("charity_distributed.contributions", { branchId: "hashed" })

db.aid_distributions.createIndex({ branchId: "hashed" })
sh.shardCollection("charity_distributed.aid_distributions", { branchId: "hashed" })

db.activity_logs.createIndex({ branchId: "hashed" })
sh.shardCollection("charity_distributed.activity_logs", { branchId: "hashed" })
```

---

## 15. Vì sao thiết kế này phù hợp MongoDB

| Yêu cầu | Cách thiết kế đáp ứng |
|---|---|
| Document model | `campaigns`, `contributions`, `aid_distributions` là aggregate root rõ ràng |
| Embedded document | Chi tiết tiền, hiện vật, proof, location, summary được embed |
| Schema linh hoạt | `contributions.type` quyết định detail tương ứng |
| Dữ liệu lồng nhau | `itemDetails[]`, `requiredResources[]`, `proofs[]`, `needs[]` |
| Snapshot lịch sử | `contributorSnapshot`, `campaignSnapshot`, `beneficiarySnapshot` |
| Hạn chế join | Màn hình lịch sử contribution/aid có đủ thông tin snapshot |
| Dashboard nhanh | `campaigns.summaryStats` denormalized |
| Phân tán theo chi nhánh | Mọi collection nghiệp vụ có `branchId` |
| Sharding | Collection tăng nhanh có shard key phù hợp |
| Audit minh bạch | `activity_logs` tự đủ ngữ cảnh actor/entity/before/after |

Thiết kế này không xem MongoDB như RDBMS trá hình. Các dữ liệu thuộc vòng đời document cha được embed, còn reference chỉ dùng khi đối tượng có vòng đời riêng hoặc cần phân quyền/truy vấn độc lập.

---

## 16. Đối chiếu với code hiện tại và hướng nâng cấp

| Hiện tại trong code | Thiết kế đề xuất | Hướng nâng cấp |
|---|---|---|
| `donors` | `contributors` | Đổi tên logic hoặc giữ collection cũ nhưng mở rộng ý nghĩa |
| `donations` chỉ tiền | `contributions` nhiều loại | Thêm `type`, `moneyDetail`, `itemDetails`, `serviceDetail`, `volunteerWorkDetail` |
| `disbursements` chỉ tiền | `aid_distributions` nhiều loại | Thêm `type`, `moneySupport`, `itemSupports`, `serviceSupport`, snapshot beneficiary |
| `campaigns.targetAmount/currentAmount/disbursedAmount` | `goals` và `summaryStats` | Giữ field cũ để tương thích, thêm field mới cho mở rộng |
| `activity_logs` field phẳng | `actor`, `entity`, `metadata` embedded | Có thể migrate dần, không bắt buộc đổi ngay |
| `branchScopedFilter` đã có | Giữ và mở rộng | Dùng chung cho mọi service nghiệp vụ |

Nếu không muốn phá API cũ:

- Giữ `/api/donations` nhưng map sang `contributions` với `type = MONEY`.
- Giữ `/api/disbursements` nhưng map sang `aid_distributions` với `type = MONEY`.
- API mới có thể là `/api/contributions` và `/api/aid-distributions`.

---

## 17. API chính theo thiết kế

| Nhóm API | Endpoint gợi ý | Ghi chú |
|---|---|---|
| Branches | `/api/branches` | Super admin quản lý, branch admin đọc branch của mình |
| Auth/Users | `/api/auth`, `/api/users` | Login, profile, tạo branch admin/staff, khóa tài khoản |
| Campaigns | `/api/campaigns` | CRUD, public active campaigns, dashboard summary |
| Contributors | `/api/contributors` | Tạo/cập nhật/tìm kiếm, lịch sử đóng góp |
| Contributions | `/api/contributions` | Tạo MONEY/ITEM/SERVICE/VOLUNTEER_WORK, confirm, reject, refund |
| Beneficiaries | `/api/beneficiaries` | Tạo/cập nhật/xác minh theo campaign/branch |
| Aid distributions | `/api/aid-distributions` | Lập kế hoạch, approve, deliver, complete, proof |
| Volunteers | `/api/volunteers` | Đăng ký, skill, availability, gán campaign |
| Activity logs | `/api/activity-logs` | Xem theo entity, branch, actor |
| Reports | `/api/reports`, `/api/stats` | Dashboard toàn hệ thống/chi nhánh/campaign |

---

## 18. Đảm bảo toàn vẹn dữ liệu trong MongoDB

MongoDB không có foreign key như RDBMS, vì vậy backend phải bảo vệ toàn vẹn bằng service logic:

- Trước khi tạo contribution, kiểm tra `campaignId`, `contributorId`, `branchId`.
- Trước khi tạo aid distribution, kiểm tra `campaignId`, `beneficiaryId`, `branchId`.
- Trước update/delete, kiểm tra branch scope.
- Dùng transaction nếu MongoDB chạy replica set.
- Nếu chưa có replica set, dùng idempotency key và state transition để tránh cộng/trừ lặp.
- Không xóa cứng contribution/aid distribution đã ghi nhận; dùng trạng thái hủy/hoàn/từ chối.
- Ghi `activity_logs` cho thao tác quan trọng.
- Dùng validator Mongoose/Zod theo từng `type`.

---

## 19. Hướng dẫn chạy và kiểm tra liên quan CSDL

Chạy backend:

```powershell
npm --prefix apps/backend install
npm --prefix apps/backend run dev
```

Seed dữ liệu:

```powershell
npm run seed
```

Reset seed:

```powershell
npm run seed:reset
```

Build toàn bộ:

```powershell
npm run build
```

Test backend:

```powershell
npm --prefix apps/backend test
```

Biến môi trường quan trọng:

```dotenv
MONGODB_URI=mongodb://<user>:<password>@<host1>,<host2>,<host3>/charity_distributed?replicaSet=rsCharity&authSource=admin
JWT_SECRET=<strong-secret>
```

Không hard-code secret, token, mật khẩu hoặc connection string trong source code.

---

## 20. Checklist chốt thiết kế

| Tiêu chí | Trạng thái |
|---|---|
| Có aggregate root rõ ràng | Đạt |
| Có embedded document đúng chỗ | Đạt |
| Có reference đúng chỗ | Đạt |
| Có snapshot lịch sử | Đạt |
| Không lạm dụng `$lookup` | Đạt |
| Có `branchId` cho dữ liệu nghiệp vụ | Đạt |
| Có phân quyền trụ sở/chi nhánh/staff/donor/volunteer | Đạt |
| Có contribution nhiều loại | Đạt |
| Có aid distribution nhiều loại | Đạt |
| Có summaryStats chống dashboard chậm | Đạt |
| Có audit log | Đạt |
| Có index theo use case | Đạt |
| Có chiến lược 4 shard | Đạt |
| Có giải thích 1 cụm trung tâm + 4 shard | Đạt |

---

## 21. Kết luận

Thiết kế mới chuyển trọng tâm từ mô hình quyên góp tiền đơn giản sang mô hình quản lý nguồn lực từ thiện đầy đủ:

- Đầu vào là `contributions`, gồm tiền, hiện vật, thuốc men, quần áo, sách vở, dịch vụ và giờ công.
- Đầu ra là `aid_distributions`, gồm hỗ trợ tiền, hiện vật, dịch vụ hoặc hỗn hợp.
- `campaigns` giữ vai trò aggregate root trung tâm với `summaryStats` để dashboard nhanh.
- `branchId` là trục phân quyền, lọc dữ liệu, index và sharding.
- Snapshot giúp dữ liệu lịch sử tự đủ thông tin, giảm phụ thuộc join.
- Cụm trung tâm quản lý namespace logic, 4 shard lưu các chunk dữ liệu vật lý, mỗi shard khoảng 1/4 dữ liệu sharded.

Với thiết kế này, MongoDB được dùng đúng thế mạnh: document lồng nhau, schema linh hoạt, denormalization có kiểm soát, query theo aggregate root và mở rộng ngang bằng sharding.
