# 15 - Thiết kế CSDL MongoDB cho dự án

## 1. Phạm vi thiết kế

Dự án sử dụng MongoDB cho hệ thống quyên góp từ thiện phân tán. Tài liệu này mô tả thiết kế dữ liệu ở mức logic và triển khai vật lý, thay cho thiết kế SQL truyền thống.

Hệ quản trị sử dụng: MongoDB 7.x  
Tên database: `charity_distributed`  
Kiến trúc tối thiểu: MongoDB Replica Set 3 node  
Kiến trúc mở rộng: MongoDB Sharded Cluster, mỗi shard là một Replica Set

Tài liệu ưu tiên schema đang chạy trong code hiện tại. Các collection hoặc trường được ghi là "khuyến nghị" chỉ dùng cho mở rộng, không bắt buộc ở bản demo.

## 2. Nguyên tắc thiết kế

- `donations` là collection giao dịch trung tâm, tăng nhanh nhất.
- `campaigns` là dữ liệu nghiệp vụ nền, đọc nhiều hơn ghi.
- `users` lưu tài khoản, vai trò và trạng thái truy cập.
- Thống kê hiện được tính động từ `donations` và `campaigns`.
- Liên kết chính giữa campaign và donation dùng khóa nghiệp vụ `campaignCode`.
- Dữ liệu nhạy cảm như mật khẩu chỉ lưu ở dạng hash.
- MongoDB không có foreign key bắt buộc như SQL; toàn vẹn dữ liệu được kiểm soát bằng backend, validation, index và RBAC.

## 3. Tổng quan collection

| Collection | Trạng thái | Vai trò | Tần suất ghi | Tần suất đọc | Ghi chú |
|---|---|---|---:|---:|---|
| `users` | Đã có model | Tài khoản, vai trò, trạng thái | Thấp | Trung bình | Cần bảo mật cao |
| `campaigns` | Đã có model | Chiến dịch quyên góp | Trung bình | Cao | Dữ liệu nền cho donation |
| `donations` | Đã có model | Giao dịch quyên góp | Cao | Cao | Collection trung tâm |
| `audit_logs` | Khuyến nghị | Nhật ký thao tác quan trọng | Trung bình | Thấp | Chưa bắt buộc trong demo |
| `stats_snapshots` | Khuyến nghị | Snapshot thống kê định kỳ | Thấp | Cao | Chỉ cần khi dữ liệu lớn |

## 4. ERD logic collection

Schema hiện tại chưa lưu trực tiếp `createdBy`, `donorUserId`, `reviewedBy`, `reviewedAt` trong `campaigns` và `donations`. Vì vậy quan hệ với `users` dưới đây là quan hệ nghiệp vụ/khuyến nghị, không phải ràng buộc vật lý đã có đủ trong model.

```text
                                  +------------------+
                                  |      users       |
                                  |------------------|
                                  | _id              |
                                  | email            |
                                  | password(hash)   |
                                  | fullName         |
                                  | role             |
                                  | isActive         |
                                  +---------+--------+
                                            |
                    optional future fields  | createdBy / donorUserId / reviewedBy
                                            |
        +-----------------------------------+-----------------------------------+
        |                                                                       |
+-------v----------+      code = campaignCode       +--------------------------v--+
|    campaigns     |------------------------------->|        donations            |
|------------------|                                |-----------------------------|
| _id              |                                | _id                         |
| code             |                                | donorName                   |
| name             |                                | donorEmail                  |
| targetAmount     |                                | amount                      |
| isActive         |                                | campaignCode                |
| startDate        |                                | note                        |
| endDate          |                                | status                      |
+-------+----------+                                +-------------+---------------+
        |                                                         |
        | aggregate                                               | audit, trace
        v                                                         v
+------------------+                                +-----------------------------+
| stats_snapshots  |                                |         audit_logs          |
|------------------|                                |-----------------------------|
| scope            |                                | requestId                   |
| campaignCode     |                                | actorId / actorEmail        |
| totalAmount      |                                | action, resource, status    |
| calculatedAt     |                                | createdAt                   |
+------------------+                                +-----------------------------+
```

Quan hệ hiện tại trong code:

| Quan hệ | Mức độ hiện tại | Cách thể hiện |
|---|---|---|
| `campaigns` 1 - n `donations` | Đã có | `campaigns.code = donations.campaignCode` |
| `users` 1 - n `campaigns` | Khuyến nghị | Chưa có `campaigns.createdBy` |
| `users` 1 - n `donations` theo donor | Một phần | Hiện lưu `donorEmail`, chưa có `donorUserId` |
| `users` 1 - n `donations` theo người duyệt | Khuyến nghị | Chưa có `reviewedBy`, `reviewedAt` |
| `campaigns` 1 - n `stats_snapshots` | Khuyến nghị | Có thể dùng `campaignCode` khi cần snapshot |

Nếu nhóm muốn thiết kế chặt hơn, nên bổ sung các trường mở rộng sau trong giai đoạn sau:

| Collection | Trường đề xuất | Ý nghĩa |
|---|---|---|
| `campaigns` | `createdBy: ObjectId` | Người tạo chiến dịch |
| `donations` | `donorUserId: ObjectId` | Tài khoản donor nếu donor có đăng nhập |
| `donations` | `reviewedBy: ObjectId` | Staff/admin duyệt hoặc từ chối |
| `donations` | `reviewedAt: Date` | Thời điểm duyệt hoặc từ chối |

## 5. Collection `users`

Mục đích: lưu tài khoản đăng nhập, phân quyền và trạng thái hoạt động.

### 5.1. Cấu trúc document

| Trường | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---:|---|---|
| `_id` | ObjectId | Có | Primary key | Khóa chính MongoDB |
| `email` | String | Có | Unique, lowercase, indexed | Email đăng nhập |
| `password` | String | Có | Hash bcrypt, min 8 | Mật khẩu đã mã hóa |
| `fullName` | String | Có | Trim | Họ tên người dùng |
| `role` | String | Có | `admin`, `staff`, `donor` | Vai trò RBAC |
| `isActive` | Boolean | Có | Default `true` | Trạng thái tài khoản |
| `createdAt` | Date | Có | Auto | Thời điểm tạo |
| `updatedAt` | Date | Có | Auto | Thời điểm cập nhật |

### 5.2. Ví dụ document

```json
{
  "_id": "ObjectId",
  "email": "admin@example.com",
  "password": "$2a$12$...",
  "fullName": "Quản trị hệ thống",
  "role": "admin",
  "isActive": true,
  "createdAt": "2026-04-29T00:00:00.000Z",
  "updatedAt": "2026-04-29T00:00:00.000Z"
}
```

## 6. Collection `campaigns`

Mục đích: lưu thông tin chiến dịch quyên góp.

### 6.1. Cấu trúc document theo code hiện tại

| Trường | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---:|---|---|
| `_id` | ObjectId | Có | Primary key | Khóa chính |
| `code` | String | Có | Unique, max 50 | Mã chiến dịch |
| `name` | String | Có | Max 120 | Tên chiến dịch |
| `description` | String | Không | Max 1000 | Mô tả |
| `targetAmount` | Number | Có | Min 0 | Mục tiêu quyên góp |
| `isActive` | Boolean | Có | Default `true` | Trạng thái mở/đóng |
| `startDate` | Date | Không | `endDate >= startDate` | Ngày bắt đầu |
| `endDate` | Date | Không | `endDate >= startDate` | Ngày kết thúc |
| `createdAt` | Date | Có | Auto | Thời điểm tạo |
| `updatedAt` | Date | Có | Auto | Thời điểm cập nhật |

### 6.2. Ví dụ document

```json
{
  "_id": "ObjectId",
  "code": "hoc-bong-2026",
  "name": "Học bổng sinh viên vượt khó",
  "description": "Hỗ trợ học phí và sinh hoạt phí cho sinh viên khó khăn.",
  "targetAmount": 50000000,
  "isActive": true,
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-12-31T00:00:00.000Z",
  "createdAt": "2026-04-29T00:00:00.000Z",
  "updatedAt": "2026-04-29T00:00:00.000Z"
}
```

## 7. Collection `donations`

Mục đích: lưu từng giao dịch quyên góp.

### 7.1. Cấu trúc document theo code hiện tại

| Trường | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---:|---|---|
| `_id` | ObjectId | Có | Primary key | Khóa chính |
| `donorName` | String | Có | Max 100 | Tên người quyên góp |
| `donorEmail` | String | Có | Email, lowercase, max 200 | Email người quyên góp |
| `amount` | Number | Có | Integer, min 1000, max 500000000 | Số tiền |
| `campaignCode` | String | Có | Max 50, indexed | Mã chiến dịch |
| `note` | String | Không | Max 1000 | Ghi chú |
| `status` | String | Có | `pending`, `verified`, `rejected` | Trạng thái duyệt |
| `createdAt` | Date | Có | Auto | Thời điểm tạo |
| `updatedAt` | Date | Có | Auto | Thời điểm cập nhật |

Ghi chú quan trọng: bản hiện tại chỉ lưu người quyên góp bằng `donorName` và `donorEmail`. Donation không bắt buộc liên kết với tài khoản `users`.

### 7.2. Ví dụ document

```json
{
  "_id": "ObjectId",
  "donorName": "Nguyễn Văn An",
  "donorEmail": "an.nguyen@example.com",
  "amount": 250000,
  "campaignCode": "hoc-bong-2026",
  "note": "Hỗ trợ học bổng tháng 4",
  "status": "verified",
  "createdAt": "2026-04-29T00:00:00.000Z",
  "updatedAt": "2026-04-29T00:00:00.000Z"
}
```

## 8. Collection mở rộng

### 8.1. `audit_logs` - khuyến nghị

Hiện tại hệ thống ghi log ở tầng ứng dụng. Nếu cần lưu audit trong database để phục vụ báo cáo hoặc truy vết dài hạn, có thể tạo thêm collection `audit_logs`.

| Trường | Kiểu | Mô tả |
|---|---|---|
| `_id` | ObjectId | Khóa chính |
| `requestId` | String | Mã truy vết request |
| `actorId` | ObjectId | Người thực hiện, nếu đã đăng nhập |
| `actorEmail` | String | Email người thực hiện |
| `actorRole` | String | Vai trò |
| `action` | String | Hành động nghiệp vụ |
| `resource` | String | Tài nguyên tác động |
| `resourceId` | String | Mã bản ghi liên quan |
| `method` | String | HTTP method |
| `endpoint` | String | API endpoint |
| `statusCode` | Number | Mã phản hồi |
| `success` | Boolean | Thành công/thất bại |
| `durationMs` | Number | Thời gian xử lý |
| `createdAt` | Date | Thời điểm ghi log |

### 8.2. `stats_snapshots` - khuyến nghị

Hệ thống hiện tính thống kê động bằng aggregation. Khi dữ liệu donation lớn, có thể lưu snapshot để giảm tải truy vấn dashboard.

| Trường | Kiểu | Mô tả |
|---|---|---|
| `_id` | ObjectId | Khóa chính |
| `scope` | String | `global` hoặc `campaign` |
| `campaignCode` | String | Mã chiến dịch nếu thống kê theo campaign |
| `totalDonations` | Number | Tổng số donation |
| `totalAmount` | Number | Tổng số tiền |
| `pendingCount` | Number | Số donation chờ duyệt |
| `verifiedCount` | Number | Số donation đã duyệt |
| `rejectedCount` | Number | Số donation bị từ chối |
| `calculatedAt` | Date | Thời điểm tính |

## 9. Index theo use case

| Use case | Collection | Index | Mục đích |
|---|---|---|---|
| Đăng nhập / tìm user theo email | `users` | `{ email: 1 } unique` | Tìm nhanh tài khoản, chống trùng email |
| Lọc user theo vai trò | `users` | `{ role: 1 }` | Phục vụ trang quản trị user |
| Tìm campaign theo mã | `campaigns` | `{ code: 1 } unique` | Đảm bảo mã chiến dịch duy nhất |
| Liệt kê campaign đang hoạt động | `campaigns` | `{ isActive: 1, createdAt: -1 }` | Phục vụ màn hình campaign công khai/admin |
| Tìm campaign theo từ khóa | `campaigns` | `{ name: "text", code: "text" }` | Phục vụ ô tìm kiếm chiến dịch |
| Xem donation theo chiến dịch | `donations` | `{ campaignCode: 1, createdAt: -1 }` | Use case quan trọng nhất |
| Duyệt donation pending | `donations` | `{ status: 1, createdAt: -1 }` | Staff/admin xử lý giao dịch chờ duyệt |
| Tra cứu lịch sử donor | `donations` | `{ donorEmail: 1, createdAt: -1 }` | Tìm donation theo email người quyên góp |
| Sắp xếp donation theo số tiền | `donations` | `{ amount: -1 }` | Báo cáo donation giá trị cao |
| Truy log theo request | `audit_logs` | `{ requestId: 1 }` | Chỉ dùng nếu triển khai audit DB |
| Đọc snapshot mới nhất | `stats_snapshots` | `{ scope: 1, campaignCode: 1, calculatedAt: -1 }` | Chỉ dùng nếu triển khai snapshot |

Lưu ý: Code hiện tại đã khai báo index chính trong Mongoose cho `campaigns.code`, `campaigns.isActive/createdAt`, `donations.campaignCode/createdAt`, `users.email`, `users.role`. Các index còn lại là khuyến nghị để tối ưu theo màn hình.

## 10. Quy tắc toàn vẹn dữ liệu

| Quy tắc | Cách kiểm soát |
|---|---|
| Mỗi campaign có `code` duy nhất | Unique index trên `campaigns.code` |
| Donation phải thuộc campaign hợp lệ | Backend nên kiểm tra `campaignCode` trước khi tạo |
| Số tiền donation hợp lệ | Zod + Mongoose min/max |
| Email donor đúng định dạng | Zod email validation |
| Trạng thái donation hợp lệ | Enum `pending`, `verified`, `rejected` |
| Mật khẩu không lưu plaintext | Hash bằng bcrypt |
| Vai trò người dùng hợp lệ | Enum `admin`, `staff`, `donor` |
| Người dùng không vượt quyền | RBAC middleware và permission map |

## 11. Thiết kế phân tán

### 11.1. Replica Set 3 node

Replica Set là kiến trúc tối thiểu đang phù hợp nhất với code và tài liệu triển khai hiện tại.

```text
                         write/read
Backend API  -------------------------->  mongo1 PRIMARY
                                               |
                         +---------------------+---------------------+
                         |                                           |
                         v                                           v
                  mongo2 SECONDARY                            mongo3 SECONDARY

Failover:
mongo1 down -> mongo2 hoặc mongo3 được bầu làm PRIMARY mới
```

Đặc điểm:

- Ghi dữ liệu qua PRIMARY.
- SECONDARY tự động nhân bản dữ liệu từ PRIMARY.
- Khi PRIMARY lỗi, replica set bầu PRIMARY mới.
- Backend kết nối bằng connection string có `replicaSet=rsCharity`.

### 11.2. Sharded Cluster mở rộng 6 máy

Khi cần chứng minh phân mảnh dữ liệu, dùng `mongos`, config server và nhiều shard. Mỗi shard nên là một Replica Set.

Mô hình 6 máy trong tài liệu dùng cho demo/lab CSDL phân tán. Trong production, config server và từng shard thường nên chạy dưới dạng Replica Set đầy đủ; vì vậy số node thực tế có thể nhiều hơn, hoặc trong môi trường thực hành có thể chạy nhiều tiến trình MongoDB trên cùng một máy.

```text
Frontend
   |
   v
Backend API
   |
   v
mongos query router
   |
   +-------------------> Config Server Replica Set
   |
   +-------------------> Shard 1 Replica Set
   |
   +-------------------> Shard 2 Replica Set
   |
   +-------------------> Shard 3 Replica Set
   |
   +-------------------> Shard 4 Replica Set
```

Collection cần shard chính: `donations`.

Shard key đề xuất cho demo:

```javascript
use charity_distributed

db.donations.createIndex({ campaignCode: "hashed" })

sh.shardCollection(
  "charity_distributed.donations",
  { campaignCode: "hashed" }
)
```

Lý do chọn:

- `campaignCode` là khóa nghiệp vụ xuất hiện thường xuyên trong truy vấn.
- `donations` là collection tăng nhanh nhất.
- Hashed sharding giúp phân phối nhiều campaign đều hơn giữa các shard.
- Phù hợp demo CSDLPT vì dễ giải thích phân mảnh theo chiến dịch.

Cảnh báo chuyên môn:

- MongoDB nên chọn shard key dựa trên cardinality, frequency và monotonicity.
- Hashed sharding phân phối đều hơn nhưng giảm lợi thế targeted range operations.
- Nếu một campaign duy nhất phát sinh donation quá lớn, vẫn có thể lệch tải theo nghiệp vụ.
- Khi dữ liệu lớn, cân nhắc shard key mở rộng hoặc bucket thời gian, ví dụ thêm `createdAt` hoặc `campaignBucket`.

## 12. Lệnh khởi tạo collection và index

### 12.1. Bản demo bắt buộc

```javascript
use charity_distributed

db.createCollection("users")
db.createCollection("campaigns")
db.createCollection("donations")

db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ isActive: 1, role: 1 })

db.campaigns.createIndex({ code: 1 }, { unique: true })
db.campaigns.createIndex({ isActive: 1, createdAt: -1 })
db.campaigns.createIndex({ name: "text", code: "text" })

db.donations.createIndex({ campaignCode: 1, createdAt: -1 })
db.donations.createIndex({ status: 1, createdAt: -1 })
db.donations.createIndex({ donorEmail: 1, createdAt: -1 })
db.donations.createIndex({ amount: -1 })
```

### 12.2. Bản mở rộng khuyến nghị

Các collection dưới đây không bắt buộc ở bản demo. Có thể tạo sẵn để mở rộng audit và dashboard khi nhóm cần.

```javascript
db.createCollection("audit_logs")
db.createCollection("stats_snapshots")

db.audit_logs.createIndex({ requestId: 1 })
db.audit_logs.createIndex({ actorId: 1, createdAt: -1 })
db.audit_logs.createIndex({ resource: 1, resourceId: 1 })
db.audit_logs.createIndex({ createdAt: -1 })

db.stats_snapshots.createIndex({ scope: 1, campaignCode: 1, calculatedAt: -1 })
db.stats_snapshots.createIndex({ calculatedAt: -1 })
```

## 13. Phân quyền

### 13.1. Phân quyền ở database

| Người dùng DB | Quyền | Mục đích |
|---|---|---|
| `charity_admin` | `dbOwner` | Quản trị database |
| `charity_backend` | `readWrite`, `dbAdmin` | Backend đọc/ghi dữ liệu |
| `charity_reporter` | Read-only | Báo cáo, thống kê |
| `charity_backup` | Backup + read | Sao lưu và khôi phục |

### 13.2. Ma trận RBAC ở ứng dụng

| Chức năng | Admin | Staff | Donor |
|---|---:|---:|---:|
| Xem campaign | Có | Có | Có |
| Tạo campaign | Có | Có | Không |
| Cập nhật campaign | Có | Có | Không |
| Xóa campaign | Có | Không | Không |
| Tạo donation | Có | Không | Có |
| Xem donation | Có | Có | Có, giới hạn |
| Duyệt/từ chối donation | Có | Có | Không |
| Xem thống kê | Có | Có | Có, giới hạn |
| Quản lý user | Có | Giới hạn | Không |
| Health/system | Có | Có | Giới hạn |

## 14. Luồng dữ liệu chính

### 14.1. Sequence tạo donation

```text
Donor
  |
  | nhập form quyên góp
  v
Frontend
  |
  | POST /api/donations
  v
Backend API
  |
  | validate Zod: donorName, donorEmail, amount, campaignCode
  | kiểm tra campaignCode tồn tại
  | kiểm tra campaign.isActive = true
  | kiểm tra startDate/endDate nếu có
  v
Donation Service
  |
  | insert status = pending
  v
MongoDB PRIMARY
  |
  | replicate
  v
MongoDB SECONDARY nodes
  |
  v
Frontend reload danh sách donation
```

### 14.2. Sequence duyệt donation

```text
Staff/Admin
  |
  | chọn verified hoặc rejected
  v
Frontend admin
  |
  | PATCH /api/donations/:id/status
  v
Backend API
  |
  | kiểm tra JWT/RBAC
  | validate status
  v
Donation Service
  |
  | update donations.status
  v
MongoDB PRIMARY
  |
  | replicate
  v
MongoDB SECONDARY nodes
  |
  v
Stats aggregate đọc lại số liệu mới
```

### 14.3. Xem thống kê

1. Backend đọc `campaigns` để lấy tổng số campaign.
2. Backend aggregate `donations` theo `status` và `amount`.
3. Nếu dữ liệu lớn, có thể đọc nhanh từ `stats_snapshots`.

Tổng tiền quyên góp chính thức chỉ tính các donation có `status = "verified"`. Các donation `pending` và `rejected` vẫn được thống kê riêng để phục vụ quản trị, nhưng không cộng vào tổng tiền đã xác nhận.

## 15. Ghi chú về phần lệch giữa ví dụ và schema hiện tại

File `apps/backend/src/common/transactions.example.ts` có một số ý tưởng mở rộng như `approvedBy`, `approvedAt`, `currentAmount`, `goalAmount`, `status = approved`. Các trường này chưa khớp hoàn toàn với model đang chạy:

| Nội dung trong ví dụ | Schema hiện tại | Cách xử lý trong tài liệu này |
|---|---|---|
| `approvedBy`, `approvedAt` | Chưa có trong `donations` | Ghi là khuyến nghị `reviewedBy`, `reviewedAt` |
| `status = approved` | Hiện dùng `verified` | Giữ `verified` theo code hiện tại |
| `goalAmount`, `currentAmount` | Hiện dùng `targetAmount`, chưa có `currentAmount` | Giữ `targetAmount`; thống kê tính động |
| `campaignCode` trong campaign | Hiện dùng `code` | Ghi rõ `campaigns.code = donations.campaignCode` |
| `stats` collection | Chưa có model chính thức | Đưa thành `stats_snapshots` khuyến nghị |

## 16. Đánh giá thiết kế

| Tiêu chí | Đánh giá |
|---|---|
| Đúng schema hiện tại | Giữ đúng `users`, `campaigns`, `donations` đang chạy |
| Dễ triển khai | Phù hợp Express + Mongoose hiện tại |
| Dễ mở rộng | Có lộ trình thêm audit, snapshot, reviewer fields |
| Tối ưu truy vấn chính | Có index theo `campaignCode`, `status`, `donorEmail`, `createdAt` |
| An toàn dữ liệu | Có validation, RBAC, password hash và logging |
| Phù hợp CSDLPT | Có nhân bản, failover và phương án sharding |

## 17. Kết luận

Thiết kế dữ liệu nên giữ `donations` làm collection trung tâm, `campaigns` làm dữ liệu nghiệp vụ nền và `users` làm lớp định danh - phân quyền. Với bản demo, Replica Set 3 node đủ để chứng minh nhân bản và failover. Với mô hình mở rộng 6 máy, sharding `donations` theo `campaignCode` dạng hashed là hợp lý, miễn là nhóm ghi rõ đánh đổi và điều kiện dữ liệu có thể gây lệch tải.
