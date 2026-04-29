# Thiết kế CSDL SQL logic và MongoDB phân tán

Tài liệu này dùng cho mục **2.2 Phân tích và Thiết kế** của báo cáo CSDL phân tán. Dự án triển khai vật lý bằng **MongoDB**, nhưng vẫn mô tả thêm **mô hình quan hệ SQL logic** để đáp ứng yêu cầu phân tích bảng, khóa, quan hệ và ERD.

## 1. Phạm vi thiết kế

Hệ thống là nền tảng quản lý quyên góp từ thiện phân tán. Các nghiệp vụ chính gồm quản lý chi nhánh, người dùng, chiến dịch, nhà tài trợ, lượt quyên góp, người thụ hưởng, giải ngân, tình nguyện viên, nhật ký hoạt động và thống kê.

Kiến trúc ứng dụng:

```text
Trình duyệt người dùng
        |
        v
Frontend React/Vite
        |
        v
Backend Node.js/Express
        |
        v
MongoDB qua connection string hoặc mongos
        |
        v
Replica Set / Sharded Cluster
```

Nguyên tắc thiết kế:

- SQL logic dùng để trình bày bảng, khóa chính, khóa ngoại và quan hệ.
- MongoDB là hệ quản trị được dùng trong dự án.
- Dữ liệu chi nhánh là trục phân quyền và phân mảnh chính.
- `donations` là collection tăng nhanh nhất, cần ưu tiên chỉ mục và phân tán.
- `activity_logs` là dữ liệu ghi nhiều, phục vụ kiểm tra và truy vết.

## 2. Phân tích chức năng truy cập dữ liệu

### 2.1 Chức năng chính

| Nhóm chức năng | Dữ liệu truy cập | Thao tác chính | Tần suất |
|---|---|---|---|
| Đăng nhập, phân quyền | `users`, `branches` | đọc, kiểm tra trạng thái, tạo JWT | Cao |
| Quản lý chi nhánh | `branches`, `users` | thêm, xem, phân quyền theo chi nhánh | Trung bình |
| Quản lý chiến dịch | `campaigns`, `branches`, `users` | tạo, sửa, xem, đóng/mở chiến dịch | Cao |
| Quản lý nhà tài trợ | `donors`, `users` | tạo, tra cứu, cập nhật tổng tiền | Trung bình |
| Quyên góp | `donations`, `campaigns`, `donors` | tạo giao dịch, cập nhật trạng thái | Rất cao |
| Người thụ hưởng | `beneficiaries`, `campaigns` | tạo hồ sơ, xác minh | Trung bình |
| Giải ngân | `disbursements`, `beneficiaries`, `campaigns` | tạo, duyệt, hoàn tất giải ngân | Trung bình |
| Tình nguyện viên | `volunteers`, `campaigns` | quản lý tham gia chiến dịch | Thấp - Trung bình |
| Thống kê | `donations`, `campaigns` | tổng hợp theo trạng thái, chiến dịch, chi nhánh | Cao |
| Nhật ký hoạt động | `activity_logs` | ghi log, truy vấn audit | Rất cao |

### 2.2 Tần suất truy cập theo vị trí

Quy ước ký hiệu:

- `H`: tần suất cao.
- `L`: tần suất thấp.
- `R`: đọc dữ liệu.
- `W`: thêm mới dữ liệu.
- `E`: sửa dữ liệu.
- `D`: xóa dữ liệu.

Trong bảng dưới đây, **Trụ sở chính** tương ứng máy Leader/Super Admin quản trị toàn hệ thống; **Các trạm** tương ứng các chi nhánh hoặc máy trạm staff/branch admin thao tác theo phạm vi `branchId`.

| Thực thể | Trụ sở chính | Các trạm |
|---|---|---|
| Branch | H.R, L.WED | H.R |
| User | H.R, L.WED | H.R, L.WED |
| Donor | H.WEDR | H.WEDR |
| Campaign | H.R, L.WED | H.R, L.WED |
| Donation | H.WEDR | H.WEDR |
| Beneficiary | H.R, L.WED | H.WEDR |
| Disbursement | H.R, L.WED | H.WEDR |
| Volunteer | H.R, L.WED | H.R, L.WED |
| ActivityLog | H.R, L.W | H.W, L.R |

Nhận xét: `Donation`, `Donor`, `Beneficiary` và `Disbursement` có tần suất ghi/sửa/đọc cao tại các trạm vì phát sinh trực tiếp từ nghiệp vụ chi nhánh. `Branch` chủ yếu được quản lý tại trụ sở chính nên các trạm gần như chỉ đọc. `ActivityLog` được ghi tự động khi có thao tác nghiệp vụ, không thiết kế sửa/xóa thủ công.

### 2.3 Phân tích theo dữ liệu thực tế

`donations` là bảng/collection trung tâm vì mỗi chiến dịch có thể phát sinh nhiều lượt quyên góp. Mỗi donation ảnh hưởng trực tiếp đến `campaigns.currentAmount` và `donors.totalDonated`, nên thao tác tạo hoặc đổi trạng thái donation cần transaction.

`activity_logs` tăng nhanh vì gần như mọi thao tác nghiệp vụ đều ghi log. Dữ liệu này ít cập nhật, chủ yếu ghi thêm và đọc khi kiểm tra audit.

`branches` là trục tổ chức dữ liệu. Hầu hết collection nghiệp vụ có `branchId`, phù hợp để phân quyền và phân mảnh ngang theo chi nhánh.

## 3. Phân quyền dữ liệu

| Vai trò | Phạm vi dữ liệu | Quyền chính |
|---|---|---|
| `SUPER_ADMIN` | toàn hệ thống | quản lý chi nhánh, người dùng, chiến dịch, donation, thống kê, health |
| `BRANCH_ADMIN` | trong chi nhánh | quản lý user chi nhánh, chiến dịch, donation, thống kê, health |
| `STAFF` | trong chi nhánh | tạo/sửa chiến dịch, duyệt donation, xem thống kê, xem user |
| `DONOR` | dữ liệu công khai và dữ liệu của mình | xem chiến dịch, tạo donation, xem donation liên quan |

Cơ chế bảo vệ:

- Backend bắt buộc xác thực JWT với các route nghiệp vụ.
- Dữ liệu chi nhánh được lọc bằng `branchId`.
- `SUPER_ADMIN` được bỏ qua giới hạn chi nhánh.
- Các thao tác thay đổi tiền donation dùng transaction để tránh lệch tổng tiền.
- `activity_logs` lưu actor, vai trò, chi nhánh, hành động, dữ liệu trước/sau.

## 4. Phân tích máy trạm và máy chủ

### 4.1 Máy trạm

Máy trạm chỉ gửi request và hiển thị kết quả. Máy trạm không lưu dữ liệu nghiệp vụ lâu dài.

Chức năng:

- Donor xem chiến dịch, tạo donation.
- Staff xử lý chiến dịch, donation, người thụ hưởng, giải ngân.
- Admin xem thống kê, quản lý người dùng và kiểm tra log.
- QA kiểm tra nhập dữ liệu, hiển thị dữ liệu, thống kê và đồng bộ.

### 4.2 Máy chủ ứng dụng

Backend chịu trách nhiệm:

- Xác thực và phân quyền.
- Validate dữ liệu đầu vào.
- Tạo transaction khi donation ảnh hưởng nhiều collection.
- Ghi nhật ký hoạt động.
- Gửi truy vấn đến MongoDB.

### 4.3 Máy chủ dữ liệu

MongoDB chịu trách nhiệm:

- Lưu trữ dữ liệu nghiệp vụ.
- Nhân bản dữ liệu qua Replica Set.
- Chuyển primary khi failover.
- Định tuyến dữ liệu theo shard khi dùng Sharded Cluster.
- Hỗ trợ aggregation cho thống kê.

## 5. Thiết kế CSDL quan hệ logic

### 5.1 Danh sách bảng

| Bảng SQL logic | Collection MongoDB | Vai trò |
|---|---|---|
| `branches` | `branches` | chi nhánh, trung tâm, vùng |
| `users` | `users` | tài khoản và phân quyền |
| `donors` | `donors` | nhà tài trợ |
| `campaigns` | `campaigns` | chiến dịch quyên góp |
| `donations` | `donations` | giao dịch quyên góp |
| `beneficiaries` | `beneficiaries` | người/đơn vị thụ hưởng |
| `disbursements` | `disbursements` | khoản giải ngân |
| `disbursement_proofs` | nhúng trong `disbursements.proofs` | minh chứng giải ngân |
| `volunteers` | `volunteers` | tình nguyện viên |
| `volunteer_campaigns` | `volunteers.joinedCampaignIds` | liên kết tình nguyện viên - chiến dịch |
| `activity_logs` | `activity_logs` | nhật ký hoạt động |

### 5.2 Cấu trúc bảng

#### `branches`

| Cột | Kiểu SQL | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | ObjectId/CHAR(24) | PK | mã chi nhánh |
| `name` | VARCHAR(160) | NOT NULL | tên chi nhánh |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | mã chi nhánh |
| `type` | VARCHAR(30) | CHECK | `HEADQUARTER`, `BRANCH`, `REGIONAL_CENTER` |
| `parent_id` | CHAR(24) | FK -> `branches.id` | chi nhánh cha |
| `province` | VARCHAR(100) | NOT NULL | tỉnh/thành |
| `district` | VARCHAR(100) | NULL | quận/huyện |
| `ward` | VARCHAR(100) | NULL | phường/xã |
| `address` | VARCHAR(500) | NULL | địa chỉ |
| `phone` | VARCHAR(20) | NULL | số điện thoại |
| `email` | VARCHAR(200) | NULL | email |
| `status` | VARCHAR(20) | NOT NULL | `ACTIVE`, `INACTIVE`, `LOCKED` |
| `created_at` | DATETIME | NOT NULL | thời điểm tạo |
| `updated_at` | DATETIME | NOT NULL | thời điểm cập nhật |

#### `users`

| Cột | Kiểu SQL | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | ObjectId/CHAR(24) | PK | mã người dùng |
| `email` | VARCHAR(200) | UNIQUE, NOT NULL | email đăng nhập |
| `phone` | VARCHAR(20) | UNIQUE NULL | số điện thoại |
| `password` | VARCHAR(255) | NOT NULL | mật khẩu đã băm |
| `full_name` | VARCHAR(160) | NOT NULL | họ tên |
| `role` | VARCHAR(30) | CHECK | `SUPER_ADMIN`, `BRANCH_ADMIN`, `STAFF`, `DONOR` |
| `branch_id` | CHAR(24) | FK -> `branches.id`, NULL | chi nhánh quản lý |
| `permissions` | JSON | NULL | quyền mở rộng |
| `is_active` | BOOLEAN | NOT NULL | trạng thái tài khoản |
| `created_at` | DATETIME | NOT NULL | thời điểm tạo |
| `updated_at` | DATETIME | NOT NULL | thời điểm cập nhật |

#### `donors`

| Cột | Kiểu SQL | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | ObjectId/CHAR(24) | PK | mã nhà tài trợ |
| `user_id` | CHAR(24) | FK -> `users.id`, NULL | tài khoản liên kết |
| `full_name` | VARCHAR(140) | NOT NULL | tên cá nhân/tổ chức |
| `phone` | VARCHAR(20) | UNIQUE NULL | số điện thoại |
| `email` | VARCHAR(200) | UNIQUE NULL | email |
| `address` | VARCHAR(500) | NULL | địa chỉ |
| `donor_type` | VARCHAR(30) | CHECK | `INDIVIDUAL`, `ORGANIZATION` |
| `total_donated` | DECIMAL(18,2) | DEFAULT 0 | tổng tiền đã quyên góp thành công |
| `created_at` | DATETIME | NOT NULL | thời điểm tạo |
| `updated_at` | DATETIME | NOT NULL | thời điểm cập nhật |

#### `campaigns`

| Cột | Kiểu SQL | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | ObjectId/CHAR(24) | PK | mã chiến dịch |
| `branch_id` | CHAR(24) | FK -> `branches.id`, NOT NULL | chi nhánh phụ trách |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | mã chiến dịch |
| `title` | VARCHAR(160) | NOT NULL | tên chiến dịch |
| `description` | VARCHAR(3000) | NULL | mô tả |
| `type` | VARCHAR(40) | CHECK | loại chiến dịch |
| `status` | VARCHAR(30) | CHECK | `DRAFT`, `ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED` |
| `target_amount` | DECIMAL(18,2) | NOT NULL | mục tiêu quyên góp |
| `current_amount` | DECIMAL(18,2) | DEFAULT 0 | tổng tiền đã nhận thành công |
| `disbursed_amount` | DECIMAL(18,2) | DEFAULT 0 | tổng tiền đã giải ngân |
| `start_date` | DATETIME | NULL | ngày bắt đầu |
| `end_date` | DATETIME | NULL | ngày kết thúc |
| `province` | VARCHAR(100) | NOT NULL | tỉnh/thành trong location |
| `district` | VARCHAR(100) | NULL | quận/huyện |
| `ward` | VARCHAR(100) | NULL | phường/xã |
| `address` | VARCHAR(500) | NULL | địa chỉ |
| `organizer_id` | CHAR(24) | FK -> `users.id`, NULL | người tổ chức |
| `created_by` | CHAR(24) | FK -> `users.id`, NULL | người tạo |
| `metadata` | JSON | NULL | dữ liệu mở rộng |
| `created_at` | DATETIME | NOT NULL | thời điểm tạo |
| `updated_at` | DATETIME | NOT NULL | thời điểm cập nhật |

Trong MongoDB, `location`, `images`, `proofImages` được nhúng trong document `campaigns`.

#### `donations`

| Cột | Kiểu SQL | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | ObjectId/CHAR(24) | PK | mã donation |
| `branch_id` | CHAR(24) | FK -> `branches.id`, NOT NULL | chi nhánh nhận donation |
| `campaign_id` | CHAR(24) | FK -> `campaigns.id`, NOT NULL | chiến dịch |
| `donor_id` | CHAR(24) | FK -> `donors.id`, NOT NULL | nhà tài trợ |
| `donor_full_name` | VARCHAR(140) | NOT NULL | snapshot tên nhà tài trợ |
| `donor_phone` | VARCHAR(20) | NULL | snapshot điện thoại |
| `donor_email` | VARCHAR(200) | NULL | snapshot email |
| `campaign_code` | VARCHAR(50) | NOT NULL | snapshot mã chiến dịch |
| `campaign_title` | VARCHAR(160) | NOT NULL | snapshot tên chiến dịch |
| `amount` | DECIMAL(18,2) | NOT NULL | số tiền |
| `payment_method` | VARCHAR(40) | NOT NULL | phương thức thanh toán |
| `payment_status` | VARCHAR(20) | CHECK | `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED` |
| `message` | VARCHAR(1000) | NULL | lời nhắn |
| `donated_at` | DATETIME | NOT NULL | thời điểm quyên góp |
| `transaction_code` | VARCHAR(100) | UNIQUE, NOT NULL | mã giao dịch |
| `created_at` | DATETIME | NOT NULL | thời điểm tạo |
| `updated_at` | DATETIME | NOT NULL | thời điểm cập nhật |

Trong MongoDB, `donorSnapshot` và `campaignSnapshot` được nhúng để giữ lịch sử tại thời điểm phát sinh giao dịch.

#### `beneficiaries`

| Cột | Kiểu SQL | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | ObjectId/CHAR(24) | PK | mã người thụ hưởng |
| `branch_id` | CHAR(24) | FK -> `branches.id`, NOT NULL | chi nhánh quản lý |
| `campaign_id` | CHAR(24) | FK -> `campaigns.id`, NOT NULL | chiến dịch liên quan |
| `name` | VARCHAR(160) | NOT NULL | tên người/đơn vị thụ hưởng |
| `type` | VARCHAR(30) | CHECK | `INDIVIDUAL`, `FAMILY`, `ORGANIZATION`, `COMMUNITY` |
| `phone` | VARCHAR(20) | NULL | điện thoại |
| `province` | VARCHAR(100) | NOT NULL | tỉnh/thành |
| `district` | VARCHAR(100) | NULL | quận/huyện |
| `ward` | VARCHAR(100) | NULL | phường/xã |
| `address` | VARCHAR(500) | NULL | địa chỉ |
| `situation_description` | VARCHAR(2000) | NULL | hoàn cảnh |
| `verification_status` | VARCHAR(20) | CHECK | `PENDING`, `VERIFIED`, `REJECTED` |
| `verified_by` | CHAR(24) | FK -> `users.id`, NULL | người xác minh |
| `verified_at` | DATETIME | NULL | thời điểm xác minh |
| `created_at` | DATETIME | NOT NULL | thời điểm tạo |
| `updated_at` | DATETIME | NOT NULL | thời điểm cập nhật |

#### `disbursements`

| Cột | Kiểu SQL | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | ObjectId/CHAR(24) | PK | mã giải ngân |
| `branch_id` | CHAR(24) | FK -> `branches.id`, NOT NULL | chi nhánh thực hiện |
| `campaign_id` | CHAR(24) | FK -> `campaigns.id`, NOT NULL | chiến dịch |
| `beneficiary_id` | CHAR(24) | FK -> `beneficiaries.id`, NOT NULL | người thụ hưởng |
| `amount` | DECIMAL(18,2) | NOT NULL | số tiền giải ngân |
| `purpose` | VARCHAR(2000) | NOT NULL | mục đích |
| `method` | VARCHAR(50) | NOT NULL | hình thức giải ngân |
| `status` | VARCHAR(20) | CHECK | `PENDING`, `APPROVED`, `COMPLETED`, `REJECTED` |
| `approved_by` | CHAR(24) | FK -> `users.id`, NULL | người duyệt |
| `approved_at` | DATETIME | NULL | thời điểm duyệt |
| `disbursed_at` | DATETIME | NULL | thời điểm giải ngân |
| `created_at` | DATETIME | NOT NULL | thời điểm tạo |
| `updated_at` | DATETIME | NOT NULL | thời điểm cập nhật |

#### `disbursement_proofs`

| Cột | Kiểu SQL | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | ObjectId/CHAR(24) | PK | mã minh chứng |
| `disbursement_id` | CHAR(24) | FK -> `disbursements.id` | khoản giải ngân |
| `type` | VARCHAR(50) | NOT NULL | loại minh chứng |
| `url` | VARCHAR(500) | NOT NULL | đường dẫn file/ảnh |
| `description` | VARCHAR(500) | NULL | mô tả |
| `uploaded_at` | DATETIME | NOT NULL | thời điểm tải lên |
| `uploaded_by` | CHAR(24) | FK -> `users.id`, NULL | người tải lên |

Trong MongoDB, bảng này được nhúng thành mảng `proofs` trong `disbursements`.

#### `volunteers`

| Cột | Kiểu SQL | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | ObjectId/CHAR(24) | PK | mã tình nguyện viên |
| `branch_id` | CHAR(24) | FK -> `branches.id`, NOT NULL | chi nhánh quản lý |
| `full_name` | VARCHAR(140) | NOT NULL | họ tên |
| `phone` | VARCHAR(20) | NULL | điện thoại |
| `email` | VARCHAR(200) | NULL | email |
| `skills` | JSON | NULL | kỹ năng |
| `status` | VARCHAR(20) | CHECK | `ACTIVE`, `INACTIVE`, `BLACKLISTED` |
| `created_at` | DATETIME | NOT NULL | thời điểm tạo |
| `updated_at` | DATETIME | NOT NULL | thời điểm cập nhật |

#### `volunteer_campaigns`

| Cột | Kiểu SQL | Ràng buộc | Mô tả |
|---|---|---|---|
| `volunteer_id` | CHAR(24) | PK, FK -> `volunteers.id` | tình nguyện viên |
| `campaign_id` | CHAR(24) | PK, FK -> `campaigns.id` | chiến dịch tham gia |

Trong MongoDB, bảng này được biểu diễn bằng mảng `joinedCampaignIds`.

#### `activity_logs`

| Cột | Kiểu SQL | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | ObjectId/CHAR(24) | PK | mã log |
| `branch_id` | CHAR(24) | FK -> `branches.id`, NULL | chi nhánh phát sinh |
| `target_branch_id` | CHAR(24) | FK -> `branches.id`, NULL | chi nhánh bị tác động |
| `actor_id` | CHAR(24) | FK -> `users.id`, NULL | người thực hiện |
| `actor_role` | VARCHAR(50) | NULL | vai trò người thực hiện |
| `actor_branch_id` | CHAR(24) | FK -> `branches.id`, NULL | chi nhánh của actor |
| `action` | VARCHAR(100) | NOT NULL | hành động |
| `entity_type` | VARCHAR(100) | NOT NULL | loại đối tượng |
| `entity_id` | VARCHAR(100) | NOT NULL | mã đối tượng |
| `description` | VARCHAR(500) | NULL | mô tả |
| `before_data` | JSON | NULL | dữ liệu trước thay đổi |
| `after_data` | JSON | NULL | dữ liệu sau thay đổi |
| `ip_address` | VARCHAR(100) | NULL | IP |
| `user_agent` | VARCHAR(300) | NULL | trình duyệt/client |
| `created_at` | DATETIME | NOT NULL | thời điểm ghi log |

## 6. Mô hình quan hệ ERD

```text
branches 1 --- n users
branches 1 --- n campaigns
branches 1 --- n donations
branches 1 --- n beneficiaries
branches 1 --- n disbursements
branches 1 --- n volunteers
branches 1 --- n activity_logs

users 1 --- n campaigns              qua campaigns.created_by
users 1 --- n beneficiaries          qua beneficiaries.verified_by
users 1 --- n disbursements          qua disbursements.approved_by
users 1 --- n activity_logs          qua activity_logs.actor_id
users 1 --- 0..1 donors              qua donors.user_id

campaigns 1 --- n donations
campaigns 1 --- n beneficiaries
campaigns 1 --- n disbursements
campaigns n --- n volunteers         qua volunteer_campaigns

donors 1 --- n donations
beneficiaries 1 --- n disbursements
disbursements 1 --- n disbursement_proofs
```

Sơ đồ chữ:

```text
                 +----------------+
                 |    branches    |
                 +----------------+
                   |     |     |
      +------------+     |     +----------------+
      v                  v                      v
+-----------+      +-------------+        +-------------+
|   users   |      |  campaigns  |        |  volunteers |
+-----------+      +-------------+        +-------------+
      |                  |     \                 /
      v                  v      \               /
+-----------+      +-------------+       +---------------------+
|  donors   |----->|  donations  |       | volunteer_campaigns |
+-----------+      +-------------+       +---------------------+
                         |
                         v
                  +---------------+
                  | beneficiaries |
                  +---------------+
                         |
                         v
                  +---------------+
                  | disbursements |
                  +---------------+
                         |
                         v
                  +----------------------+
                  | disbursement_proofs |
                  +----------------------+

+---------------+
| activity_logs |
+---------------+
```

## 7. Thiết kế MongoDB tương ứng

### 7.1 Ánh xạ bảng sang collection

| SQL logic | MongoDB | Cách biểu diễn |
|---|---|---|
| `branches` | `branches` | document riêng |
| `users` | `users` | document riêng, tham chiếu `branchId` |
| `donors` | `donors` | document riêng, có thể liên kết `userId` |
| `campaigns` | `campaigns` | document riêng, nhúng `location`, `images`, `proofImages` |
| `donations` | `donations` | document riêng, nhúng snapshot donor/campaign |
| `beneficiaries` | `beneficiaries` | document riêng, nhúng `location` |
| `disbursements` | `disbursements` | document riêng, nhúng `proofs` |
| `volunteers` | `volunteers` | document riêng, nhúng `skills`, `joinedCampaignIds` |
| `activity_logs` | `activity_logs` | document riêng, lưu `before` và `after` dạng mixed |
| `stats` | không lưu riêng | tính bằng aggregation từ `donations` và `campaigns` |

### 7.2 Lý do nhúng dữ liệu

- `donorSnapshot` và `campaignSnapshot` trong `donations` giúp giữ nguyên thông tin tại thời điểm quyên góp, kể cả khi donor hoặc campaign đổi tên sau này.
- `location` là nhóm thuộc tính nhỏ, luôn đi cùng campaign/beneficiary nên nên nhúng.
- `proofs` luôn thuộc một khoản giải ngân, ít cần truy vấn độc lập nên nhúng trong `disbursements`.
- `activity_logs.before` và `activity_logs.after` có cấu trúc linh hoạt nên dùng kiểu mixed/JSON.

## 8. Chỉ mục dữ liệu

| Collection | Index | Use case |
|---|---|---|
| `branches` | `{ code: 1 }` unique | tìm chi nhánh theo mã |
| `branches` | `{ status: 1, createdAt: -1 }` | danh sách chi nhánh theo trạng thái |
| `users` | `{ email: 1 }` unique | đăng nhập |
| `users` | `{ phone: 1 }` unique sparse | tra cứu theo số điện thoại |
| `users` | `{ branchId: 1, role: 1 }` | lọc user theo chi nhánh và vai trò |
| `campaigns` | `{ code: 1 }` unique | xem/sửa chiến dịch theo mã |
| `campaigns` | `{ branchId: 1, status: 1, createdAt: -1 }` | danh sách chiến dịch của chi nhánh |
| `campaigns` | `{ branchId: 1, type: 1, createdAt: -1 }` | lọc chiến dịch theo loại |
| `donors` | `{ phone: 1 }` unique sparse | chống trùng nhà tài trợ theo điện thoại |
| `donors` | `{ email: 1 }` unique sparse | chống trùng nhà tài trợ theo email |
| `donations` | `{ transactionCode: 1 }` unique | chống trùng giao dịch |
| `donations` | `{ branchId: 1, campaignId: 1, donatedAt: -1 }` | xem donation theo chiến dịch trong chi nhánh |
| `donations` | `{ campaignId: 1, paymentStatus: 1, donatedAt: -1 }` | thống kê và duyệt theo trạng thái |
| `donations` | `{ donorId: 1, donatedAt: -1 }` | lịch sử quyên góp của donor |
| `beneficiaries` | `{ branchId: 1, campaignId: 1, verificationStatus: 1 }` | xác minh người thụ hưởng |
| `disbursements` | `{ branchId: 1, campaignId: 1, status: 1, createdAt: -1 }` | duyệt và theo dõi giải ngân |
| `volunteers` | `{ branchId: 1, status: 1, createdAt: -1 }` | quản lý tình nguyện viên theo chi nhánh |
| `activity_logs` | `{ branchId: 1, createdAt: -1 }` | audit theo chi nhánh |
| `activity_logs` | `{ entityType: 1, entityId: 1, createdAt: -1 }` | truy vết lịch sử của một đối tượng |

## 9. Thiết kế CSDL phân tán

### 9.1 Lược đồ thông tin phục vụ phân mảnh

Các thuộc tính dùng cho phân mảnh và định vị:

| Thuộc tính | Collection | Vai trò |
|---|---|---|
| `branchId` | hầu hết collection nghiệp vụ | phân mảnh ngang theo chi nhánh |
| `campaignId` | `donations`, `beneficiaries`, `disbursements` | gom dữ liệu theo chiến dịch |
| `paymentStatus` | `donations` | lọc giao dịch cần xử lý |
| `donatedAt` | `donations` | truy vấn theo thời gian |
| `entityType`, `entityId` | `activity_logs` | truy vết nghiệp vụ |

### 9.2 Phân mảnh ngang dẫn xuất

Phân mảnh gốc dựa trên `branches`:

```text
BR_HCM = branches where code = 'HCM'
BR_DNG = branches where code = 'DNG'
BR_HQ  = branches where code = 'HQ'
```

Các fragment dẫn xuất:

```text
CAMPAIGNS_HCM      = campaigns where branchId in BR_HCM
DONATIONS_HCM      = donations where branchId in BR_HCM
BENEFICIARIES_HCM  = beneficiaries where branchId in BR_HCM
DISBURSEMENTS_HCM  = disbursements where branchId in BR_HCM
VOLUNTEERS_HCM     = volunteers where branchId in BR_HCM
LOGS_HCM           = activity_logs where branchId in BR_HCM
```

Tương tự cho `DNG` và các chi nhánh khác. Cách này phù hợp với code hiện tại vì backend đã lọc dữ liệu bằng `branchId`.

### 9.3 Nhân bản

Dữ liệu cần nhân bản:

- `branches`: cần ở mọi site để định tuyến nghiệp vụ.
- `users`: cần nhân bản để xác thực và phân quyền.
- `campaigns`: nên nhân bản hoặc đọc qua mongos để donor xem chiến dịch nhanh.
- `activity_logs`: nhân bản để không mất audit khi node lỗi.

Trong MongoDB, nhân bản được thực hiện bằng Replica Set. Mỗi shard nên là một Replica Set gồm 1 primary và ít nhất 2 secondary.

### 9.4 Phân mảnh dọc

Phân mảnh dọc không phải kỹ thuật chính của dự án, nhưng có thể mô tả ở mức thiết kế:

| Thực thể | Fragment công khai | Fragment nhạy cảm |
|---|---|---|
| `users` | `id`, `fullName`, `role`, `branchId`, `isActive` | `password`, `permissions`, `phone` |
| `donors` | `fullName`, `donorType`, `totalDonated` | `phone`, `email`, `address` |
| `activity_logs` | `action`, `entityType`, `createdAt` | `before`, `after`, `ipAddress`, `userAgent` |

Khi triển khai MongoDB hiện tại, các fragment này vẫn nằm trong cùng document. Việc bảo vệ được thực hiện bằng API, RBAC và hạn chế field trả về.

## 10. Thiết kế định vị

### 10.1 Định vị theo mô hình 6 máy

```text
Máy 1: Frontend + Backend + QA + mongos
Máy 2: Replica set trung tâm / config hoặc dữ liệu lõi
Máy 3: Shard 1 - dữ liệu một nhóm chi nhánh/chiến dịch
Máy 4: Shard 2 - dữ liệu một nhóm chi nhánh/chiến dịch
Máy 5: Shard 3 - dữ liệu một nhóm chi nhánh/chiến dịch
Máy 6: Shard 4 - dữ liệu một nhóm chi nhánh/chiến dịch
```

Sơ đồ định vị:

```text
                 +--------------------------+
                 | Máy 1                    |
                 | FE + BE + QA + mongos    |
                 +------------+-------------+
                              |
               +--------------+--------------+
               |                             |
               v                             v
      +------------------+          +------------------+
      | Metadata/central |          | Shard routing    |
      | Máy 2            |          | qua mongos       |
      +------------------+          +------------------+
               |                             |
      +--------+----------+----------+-------+
      |                   |                  |
      v                   v                  v
+-------------+     +-------------+    +-------------+    +-------------+
| Máy 3       |     | Máy 4       |    | Máy 5       |    | Máy 6       |
| Shard 1 RS  |     | Shard 2 RS  |    | Shard 3 RS  |    | Shard 4 RS  |
+-------------+     +-------------+    +-------------+    +-------------+
```

### 10.2 Gợi ý định vị fragment

| Fragment | Vị trí chính | Vị trí nhân bản | Lý do |
|---|---|---|---|
| `branches`, `users` | Máy 2 / central | các secondary | dữ liệu lõi, cần ổn định |
| `campaigns_HCM`, `donations_HCM` | Shard 1 | Replica Set của Shard 1 | dữ liệu chi nhánh HCM |
| `campaigns_DNG`, `donations_DNG` | Shard 2 | Replica Set của Shard 2 | dữ liệu chi nhánh Đà Nẵng |
| `campaigns_other`, `donations_other` | Shard 3 hoặc 4 | Replica Set tương ứng | mở rộng theo chi nhánh |
| `activity_logs` | shard theo `branchId` hoặc thời gian | Replica Set tương ứng | log tăng nhanh |

## 11. Lược đồ ánh xạ

### 11.1 Global schema

```text
G = {
  branches,
  users,
  donors,
  campaigns,
  donations,
  beneficiaries,
  disbursements,
  volunteers,
  activity_logs
}
```

### 11.2 Local schema

```text
L_HCM = {
  branches_HCM,
  users_HCM,
  campaigns_HCM,
  donations_HCM,
  beneficiaries_HCM,
  disbursements_HCM,
  volunteers_HCM,
  logs_HCM
}

L_DNG = {
  branches_DNG,
  users_DNG,
  campaigns_DNG,
  donations_DNG,
  beneficiaries_DNG,
  disbursements_DNG,
  volunteers_DNG,
  logs_DNG
}
```

### 11.3 Công thức ánh xạ

```text
campaigns      = union(campaigns_HCM, campaigns_DNG, campaigns_other)
donations      = union(donations_HCM, donations_DNG, donations_other)
beneficiaries  = union(beneficiaries_HCM, beneficiaries_DNG, beneficiaries_other)
disbursements  = union(disbursements_HCM, disbursements_DNG, disbursements_other)
activity_logs  = union(logs_HCM, logs_DNG, logs_other)
```

Trong MongoDB Sharded Cluster, `mongos` thực hiện ánh xạ này tự động dựa trên shard key và metadata từ config server.

## 12. Shard key khuyến nghị

Với schema hiện tại, `donations` không có field top-level `campaignCode`; mã chiến dịch nằm trong `campaignSnapshot.code`. Vì vậy có hai lựa chọn đúng:

| Lựa chọn | Shard key | Khi dùng |
|---|---|---|
| Khớp code hiện tại | `{ campaignId: "hashed" }` | đơn giản, đúng schema, phân phối donation theo chiến dịch |
| Khớp tài liệu cũ | `{ "campaignSnapshot.code": "hashed" }` | dùng khi muốn giải thích theo mã chiến dịch |

Khuyến nghị cho báo cáo và triển khai hiện tại:

```javascript
sh.enableSharding("charity_distributed")
db.donations.createIndex({ campaignId: "hashed" })
sh.shardCollection(
  "charity_distributed.donations",
  { campaignId: "hashed" }
)
```

Để vẫn truy vấn tốt theo chi nhánh, giữ index nghiệp vụ:

```javascript
db.donations.createIndex({ branchId: 1, campaignId: 1, donatedAt: -1 })
```

Nếu nhóm muốn dùng đúng tên `campaignCode` như tài liệu cũ, cần bổ sung field top-level `campaignCode` vào schema `donations` hoặc đổi shard key sang `"campaignSnapshot.code"`.

## 13. Kiến trúc QTLPT

| Nội dung | Thiết kế |
|---|---|
| Kiểu hệ thống | Client/Server |
| Client | Frontend React chạy trên máy trạm hoặc máy Leader |
| Server ứng dụng | Backend Express xử lý API, RBAC, transaction |
| Server dữ liệu | MongoDB Replica Set hoặc Sharded Cluster |
| Linked Server theo SQL Server | Không dùng; MongoDB dùng `mongos` và connection string |
| Publication/Subscription theo SQL Server | Không dùng; MongoDB dùng oplog replication trong Replica Set |
| Đồng bộ hóa | Primary ghi oplog, secondary replicate; shard metadata do config server quản lý |
| Trigger | Ưu tiên application-level transaction và `activity_logs`; MongoDB Atlas Trigger không dùng trong bản local |

## 14. Luồng giao tác chính

### 14.1 Tạo donation

```text
Frontend
  -> Backend POST /api/donations
  -> kiểm tra JWT và branch scope
  -> đọc campaign theo campaignId
  -> đọc donor theo donorId
  -> mở MongoDB transaction
  -> insert donations
  -> nếu paymentStatus = SUCCESS:
       tăng campaigns.currentAmount
       tăng donors.totalDonated
  -> ghi activity_logs
  -> commit transaction
  -> Replica Set đồng bộ dữ liệu sang secondary
```

### 14.2 Cập nhật trạng thái donation

```text
Staff/Admin
  -> Backend PATCH /api/donations/:id/status
  -> kiểm tra quyền và branch scope
  -> đọc donation hiện tại
  -> tính delta tiền:
       PENDING/FAILED -> SUCCESS: +amount
       SUCCESS -> REFUNDED: -amount
  -> transaction:
       cập nhật paymentStatus
       cập nhật campaigns.currentAmount
       cập nhật donors.totalDonated
       ghi activity_logs
  -> commit
```

### 14.3 Thống kê

```text
Frontend
  -> Backend GET /api/stats/overview
  -> lọc theo branchId nếu không phải SUPER_ADMIN
  -> aggregate donations theo paymentStatus
  -> count campaigns ACTIVE/inactive
  -> trả kết quả dashboard
```

## 15. Cài đặt vật lý cần chứng minh trong báo cáo

| Yêu cầu của cô | Cách thể hiện trong dự án MongoDB |
|---|---|
| Cài VPN | dùng Tailscale, ZeroTier hoặc Radmin; chụp IP từng máy |
| Tạo đường link giữa server | kiểm tra bằng `Test-NetConnection`, `ping`, `tailscale status` |
| Cài SQL Server hoặc MongoDB | cài MongoDB Community Server 7.x hoặc Docker MongoDB |
| Kiểm tra Agent | với MongoDB kiểm tra service `mongod`, process `mongos`, `rs.status()` |
| Tạo link CSDL giữa server | dùng connection string replica set hoặc `sh.addShard()` |
| Tạo Publication | với MongoDB thay bằng Replica Set replication và oplog |
| Thử nhập dữ liệu | gọi API tạo campaign, donor, donation hoặc dùng `mongosh insertOne` |
| Thử hiển thị dữ liệu | gọi API list hoặc `db.collection.find()` trên primary/secondary |
| Thử thống kê | gọi `/api/stats/overview` hoặc aggregate trên `donations` |
| Thử đồng bộ | ghi vào primary, đọc lại ở secondary sau khi replicate |
| Thử phân mảnh | dùng `sh.status()`, `db.donations.getShardDistribution()` |

## 16. Kết luận thiết kế

Thiết kế logic theo SQL cho thấy hệ thống có đầy đủ thực thể, khóa và quan hệ nghiệp vụ. Thiết kế vật lý bằng MongoDB phù hợp hơn với dự án vì hỗ trợ document lồng nhau, transaction, Replica Set, sharding và aggregation.

Trục thiết kế quan trọng nhất là `branchId` để phân quyền và phân mảnh theo chi nhánh. Collection cần tối ưu mạnh nhất là `donations`; collection cần bảo vệ và truy vết tốt nhất là `users` và `activity_logs`. Với mô hình này, dự án đáp ứng được yêu cầu phân tích CSDL, thiết kế CSDL quan hệ, thiết kế CSDL phân tán, định vị dữ liệu, ánh xạ dữ liệu và kiến trúc triển khai thực tế trên nhiều máy.
