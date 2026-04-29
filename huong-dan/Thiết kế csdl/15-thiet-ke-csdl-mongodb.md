# 15 - Thiết kế CSDL MongoDB cho dự án

## 1. Phạm vi thiết kế

Dự án sử dụng MongoDB cho hệ thống quyên góp từ thiện phân tán. Tài liệu này mô tả thiết kế dữ liệu ở mức logic và triển khai vật lý, thay cho thiết kế SQL truyền thống.

Hệ quản trị sử dụng: MongoDB 7.x  
Tên database: `charity_distributed`  
Kiến trúc tối thiểu: MongoDB Replica Set 3 node  
Kiến trúc mở rộng: MongoDB Sharded Cluster, mỗi shard là một Replica Set

Tài liệu ưu tiên mô hình dữ liệu cần trình bày trong báo cáo. Một số trường/collection có thể cần bổ sung thêm vào code nếu nhóm muốn triển khai đầy đủ đúng thiết kế.

## 2. Nguyên tắc thiết kế

- `donations` là collection giao dịch trung tâm, tăng nhanh nhất.
- `campaigns` là dữ liệu nghiệp vụ nền, đọc nhiều hơn ghi.
- `users` lưu tài khoản, username, vai trò, phạm vi quản trị và trạng thái truy cập.
- `payment_transactions` tách thông tin thanh toán khỏi nghiệp vụ donation.
- `campaign_reports` lưu báo cáo tiến độ và minh chứng sử dụng quỹ theo chiến dịch.
- Thống kê hiện được tính động từ `donations` và `campaigns`.
- Liên kết chính giữa campaign và donation dùng khóa nghiệp vụ `campaignCode`.
- Dữ liệu nhạy cảm như mật khẩu chỉ lưu ở dạng hash.
- MongoDB không có foreign key bắt buộc như SQL; toàn vẹn dữ liệu được kiểm soát bằng backend, validation, index và RBAC.

## 3. Tổng quan collection

Bộ thiết kế gồm 6 collection. Tần suất truy cập phụ thuộc vào vai trò sử dụng, không chỉ phụ thuộc vào loại dữ liệu.

| Collection | Vai trò dữ liệu | Role truy cập chính | Ghi | Đọc | Ghi chú |
|---|---|---|---:|---:|---|
| `users` | Tài khoản, username, vai trò, phạm vi quản trị | Admin hệ thống | Thấp | Trung bình | Dữ liệu bảo mật cao |
| `campaigns` | Chiến dịch quyên góp | Admin hệ thống, admin chi nhánh, staff, donor | Trung bình | Cao | Dữ liệu nền cho donation |
| `donations` | Giao dịch quyên góp | Donor, staff, admin chi nhánh, admin hệ thống | Cao | Cao | Collection trung tâm |
| `payment_transactions` | Trạng thái thanh toán của donation | Donor, staff, admin chi nhánh | Cao | Trung bình | Tách thanh toán khỏi donation |
| `campaign_reports` | Báo cáo tiến độ, minh chứng sử dụng quỹ | Staff, admin chi nhánh, admin hệ thống, donor | Trung bình | Cao | Tăng tính minh bạch |
| `audit_logs` | Nhật ký thao tác quan trọng | Admin hệ thống, QA/Leader | Trung bình | Thấp | Phục vụ truy vết |

## 4. ERD logic collection

Quan hệ dưới đây là quan hệ logic dùng cho thiết kế báo cáo. MongoDB không ép khóa ngoại như SQL, nên backend chịu trách nhiệm kiểm tra toàn vẹn.

```text
+------------------+        manages/creates        +------------------+
|      users       |------------------------------->|    campaigns     |
|------------------|                                |------------------|
| _id              |                                | _id              |
| username         |                                | code             |
| email            |                                | name             |
| password(hash)   |                                | targetAmount     |
| fullName         |                                | isActive         |
| role             |                                | branchCode       |
| branchCode       |                                +--------+---------+
| isActive         |                                         |
+--------+---------+                                         | code = campaignCode
         |                                                   v
         | creates/reviews                         +---------+---------+
         +---------------------------------------->|    donations      |
                                                  |-------------------|
                                                  | _id               |
                                                  | donorName         |
                                                  | donorEmail        |
                                                  | amount            |
                                                  | campaignCode      |
                                                  | status            |
                                                  +----+---------+----+
                                                       |         |
                                                       |         | 1 - n
                                                       |         v
                                                       | +-------+----------------+
                                                       | | payment_transactions   |
                                                       | |------------------------|
                                                       | | donationId             |
                                                       | | providerTxnId          |
                                                       | | method                 |
                                                       | | status                 |
                                                       | +------------------------+
                                                       |
         +---------------------------------------------+------------------+
         |
         v
+--------+----------+
| campaign_reports  |
|-------------------|
| campaignCode      |
| branchCode        |
| reportPeriod      |
| reportStatus      |
+-------------------+

+------------------+
|    audit_logs    |
|------------------|
| requestId        |
| actorId          |
| action           |
| resource         |
| createdAt        |
+------------------+
```

Quan hệ hiện tại trong code:

| Quan hệ | Mức độ hiện tại | Cách thể hiện |
|---|---|---|
| `campaigns` 1 - n `donations` | Đã có | `campaigns.code = donations.campaignCode` |
| `users` 1 - n `campaigns` | Khuyến nghị | Chưa có `campaigns.createdBy` |
| `users` 1 - n `donations` theo donor | Một phần | Hiện lưu `donorEmail`, chưa có `donorUserId` |
| `users` 1 - n `donations` theo người duyệt | Khuyến nghị | Chưa có `reviewedBy`, `reviewedAt` |
| `campaigns` 1 - n `campaign_reports` | Bổ sung thiết kế | Lưu báo cáo theo `campaignCode` |
| `donations` 1 - n `payment_transactions` | Bổ sung thiết kế | Một donation có thể có nhiều lần thanh toán/thử thanh toán |

Nếu nhóm muốn thiết kế chặt hơn, nên bổ sung các trường mở rộng sau trong giai đoạn sau:

| Collection | Trường đề xuất | Ý nghĩa |
|---|---|---|
| `campaigns` | `createdBy: ObjectId` | Người tạo chiến dịch |
| `donations` | `donorUserId: ObjectId` | Tài khoản donor nếu donor có đăng nhập |
| `donations` | `reviewedBy: ObjectId` | Staff/admin duyệt hoặc từ chối |
| `donations` | `reviewedAt: Date` | Thời điểm duyệt hoặc từ chối |
| `campaigns`, `campaign_reports` | `branchCode: String` | Mã chi nhánh quản lý dữ liệu |

## 5. Collection `users`

Mục đích: lưu tài khoản đăng nhập, phân quyền và trạng thái hoạt động.

### 5.1. Cấu trúc document

| Trường | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---:|---|---|
| `_id` | ObjectId | Có | Primary key | Khóa chính MongoDB |
| `username` | String | Có | Unique, trim, indexed | Tên đăng nhập ngắn |
| `email` | String | Có | Unique, lowercase, indexed | Email đăng nhập |
| `password` | String | Có | Hash bcrypt, min 8 | Mật khẩu đã mã hóa |
| `fullName` | String | Có | Trim | Họ tên người dùng |
| `role` | String | Có | `system_admin`, `branch_admin`, `staff`, `donor` | Vai trò RBAC |
| `branchCode` | String | Không | Bắt buộc với admin chi nhánh/staff | Mã chi nhánh quản lý |
| `isActive` | Boolean | Có | Default `true` | Trạng thái tài khoản |
| `createdAt` | Date | Có | Auto | Thời điểm tạo |
| `updatedAt` | Date | Có | Auto | Thời điểm cập nhật |

### 5.2. Ví dụ document

```json
{
  "_id": "ObjectId",
  "username": "system_admin",
  "email": "system.admin@example.com",
  "password": "$2a$12$...",
  "fullName": "System Administrator",
  "role": "system_admin",
  "branchCode": null,
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
  "code": "student-scholarship-2026",
  "name": "Student Scholarship 2026",
  "description": "Support tuition and living expenses for disadvantaged students.",
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
  "donorName": "John Smith",
  "donorEmail": "john.smith@example.com",
  "amount": 250000,
  "campaignCode": "student-scholarship-2026",
  "note": "April scholarship donation",
  "status": "verified",
  "createdAt": "2026-04-29T00:00:00.000Z",
  "updatedAt": "2026-04-29T00:00:00.000Z"
}
```

## 8. Collection bổ sung

### 8.1. `payment_transactions`

Mục đích: lưu trạng thái thanh toán gắn với donation. Collection này giúp tách rõ ý định quyên góp và giao dịch tiền thực tế.

| Trường | Kiểu | Mô tả |
|---|---|---|
| `_id` | ObjectId | Khóa chính |
| `donationId` | ObjectId | Donation liên quan |
| `campaignCode` | String | Mã chiến dịch để truy vấn nhanh |
| `donorEmail` | String | Email người thanh toán |
| `amount` | Number | Số tiền thanh toán |
| `method` | String | Phương thức: bank_transfer, cash, e_wallet |
| `providerTxnId` | String | Mã giao dịch từ ngân hàng/ví nếu có |
| `status` | String | pending, success, failed, refunded |
| `paidAt` | Date | Thời điểm thanh toán thành công |
| `createdAt` | Date | Thời điểm tạo |
| `updatedAt` | Date | Thời điểm cập nhật |

### 8.2. `campaign_reports`

Mục đích: lưu báo cáo tiến độ, giải ngân và minh chứng sử dụng quỹ của từng chiến dịch/chi nhánh.

| Trường | Kiểu | Mô tả |
|---|---|---|
| `_id` | ObjectId | Khóa chính |
| `campaignCode` | String | Mã chiến dịch |
| `branchCode` | String | Mã chi nhánh lập báo cáo |
| `title` | String | Tiêu đề báo cáo |
| `reportPeriod` | String | Kỳ báo cáo, ví dụ 2026-04 |
| `content` | String | Nội dung báo cáo |
| `usedAmount` | Number | Số tiền đã sử dụng |
| `attachments` | Array | Danh sách minh chứng/hình ảnh/link |
| `reportStatus` | String | draft, submitted, approved, rejected |
| `createdBy` | ObjectId | Người lập báo cáo |
| `approvedBy` | ObjectId | Người duyệt báo cáo nếu có |
| `createdAt` | Date | Thời điểm tạo |
| `updatedAt` | Date | Thời điểm cập nhật |

### 8.3. `audit_logs`

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

## 9. Index theo use case

| Use case | Collection | Index | Mục đích |
|---|---|---|---|
| Đăng nhập / tìm user theo username | `users` | `{ username: 1 } unique` | Tên đăng nhập chính, chống trùng username |
| Đăng nhập / tìm user theo email | `users` | `{ email: 1 } unique` | Tìm nhanh tài khoản, chống trùng email |
| Lọc user theo vai trò/chi nhánh | `users` | `{ role: 1, branchCode: 1 }` | Tách admin hệ thống, admin chi nhánh, staff |
| Tìm campaign theo mã | `campaigns` | `{ code: 1 } unique` | Đảm bảo mã chiến dịch duy nhất |
| Liệt kê campaign đang hoạt động | `campaigns` | `{ isActive: 1, createdAt: -1 }` | Phục vụ màn hình campaign công khai/admin |
| Tìm campaign theo từ khóa | `campaigns` | `{ name: "text", code: "text" }` | Phục vụ ô tìm kiếm chiến dịch |
| Xem donation theo chiến dịch | `donations` | `{ campaignCode: 1, createdAt: -1 }` | Use case quan trọng nhất |
| Duyệt donation pending | `donations` | `{ status: 1, createdAt: -1 }` | Staff/admin xử lý giao dịch chờ duyệt |
| Tra cứu lịch sử donor | `donations` | `{ donorEmail: 1, createdAt: -1 }` | Tìm donation theo email người quyên góp |
| Sắp xếp donation theo số tiền | `donations` | `{ amount: -1 }` | Báo cáo donation giá trị cao |
| Đối soát thanh toán theo donation | `payment_transactions` | `{ donationId: 1, createdAt: -1 }` | Xem các lần thanh toán của một donation |
| Đối soát thanh toán theo trạng thái | `payment_transactions` | `{ status: 1, createdAt: -1 }` | Lọc giao dịch pending/success/failed |
| Xem báo cáo theo chiến dịch | `campaign_reports` | `{ campaignCode: 1, reportPeriod: -1 }` | Theo dõi báo cáo tiến độ chiến dịch |
| Xem báo cáo theo chi nhánh | `campaign_reports` | `{ branchCode: 1, reportPeriod: -1 }` | Admin chi nhánh và admin hệ thống kiểm tra |
| Truy log theo request | `audit_logs` | `{ requestId: 1 }` | Truy vết thao tác và lỗi |

Lưu ý: thiết kế báo cáo bổ sung `username`, `payment_transactions`, `campaign_reports` và phân quyền admin theo phạm vi. Nếu code hiện tại chưa có đủ các index này thì cần bổ sung khi triển khai.

## 10. Quy tắc toàn vẹn dữ liệu

| Quy tắc | Cách kiểm soát |
|---|---|
| Mỗi user có `username` duy nhất | Unique index trên `users.username` |
| Mỗi campaign có `code` duy nhất | Unique index trên `campaigns.code` |
| Donation phải thuộc campaign hợp lệ | Backend nên kiểm tra `campaignCode` trước khi tạo |
| Payment transaction phải gắn với donation hợp lệ | Backend kiểm tra `donationId` |
| Campaign report phải thuộc campaign/chi nhánh hợp lệ | Backend kiểm tra `campaignCode`, `branchCode` |
| Số tiền donation hợp lệ | Zod + Mongoose min/max |
| Email donor đúng định dạng | Zod email validation |
| Trạng thái donation hợp lệ | Enum `pending`, `verified`, `rejected` |
| Mật khẩu không lưu plaintext | Hash bằng bcrypt |
| Vai trò người dùng hợp lệ | Enum `system_admin`, `branch_admin`, `staff`, `donor` |
| Admin chi nhánh chỉ quản lý dữ liệu chi nhánh | Kiểm tra `branchCode` trong RBAC |
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

### 11.2. Sharded Cluster demo/lab 6 máy

Khi cần chứng minh phân mảnh dữ liệu, dùng `mongos`, một server dữ liệu tổng trung tâm và 4 server chi nhánh. Mỗi server dữ liệu trong môi trường lab có thể chạy một hoặc nhiều tiến trình MongoDB để mô phỏng Replica Set.

Mô hình 6 máy trong tài liệu dùng cho demo/lab CSDL phân tán, gồm 1 máy điều phối và 5 server dữ liệu. Trong production, config server và từng shard thường nên chạy dưới dạng Replica Set đầy đủ; vì vậy số node thực tế có thể nhiều hơn.

| Máy/Server | Vai trò | Dữ liệu chính |
|---|---|---|
| Máy 1 | Điều phối | Frontend, Backend, QA, `mongos` |
| Server dữ liệu trung tâm | Dữ liệu tổng | `users`, `campaigns`, `audit_logs`, metadata, báo cáo tổng hợp |
| Server chi nhánh 1 | Mảnh 1 | `donations`, `payment_transactions`, `campaign_reports` thuộc chi nhánh 1 |
| Server chi nhánh 2 | Mảnh 2 | `donations`, `payment_transactions`, `campaign_reports` thuộc chi nhánh 2 |
| Server chi nhánh 3 | Mảnh 3 | `donations`, `payment_transactions`, `campaign_reports` thuộc chi nhánh 3 |
| Server chi nhánh 4 | Mảnh 4 | `donations`, `payment_transactions`, `campaign_reports` thuộc chi nhánh 4 |

Phân mảnh nghiệp vụ vẫn là 4 mảnh, tương ứng 4 server chi nhánh. Server dữ liệu trung tâm không tính là mảnh chi nhánh; nó giữ dữ liệu dùng chung, dữ liệu quản trị và nhận dữ liệu tổng hợp từ các mảnh chi nhánh.

```text
Máy 1 - Điều phối
Frontend + Backend + QA + mongos
        |
        v
Cụm dữ liệu 5 server

                         +--------------------------------------+
                         | Server dữ liệu trung tâm             |
                         | users, campaigns, audit_logs         |
                         | metadata, báo cáo tổng hợp           |
                         +-------------------+------------------+
                                             |
                  tham chiếu campaign/user/branchCode
                                             |
        +--------------------+---------------+---------------+--------------------+
        |                    |               |               |                    |
        v                    v               v               v                    |
+---------------+    +---------------+  +---------------+  +---------------+      |
| Chi nhánh 1   |    | Chi nhánh 2   |  | Chi nhánh 3   |  | Chi nhánh 4   |      |
| Mảnh 1        |    | Mảnh 2        |  | Mảnh 3        |  | Mảnh 4        |      |
| donations     |    | donations     |  | donations     |  | donations     |      |
| payments      |    | payments      |  | payments      |  | payments      |      |
| reports       |    | reports       |  | reports       |  | reports       |      |
+-------+-------+    +-------+-------+  +-------+-------+  +-------+-------+      |
        |                    |                  |                  |              |
        +--------------------+------------------+------------------+--------------+
        dữ liệu tổng hợp / trạng thái báo cáo trả về server trung tâm
```

Collection cần shard chính: `donations`. Các collection `payment_transactions` và `campaign_reports` nên có `campaignCode`/`branchCode` để định vị cùng mảnh chi nhánh khi cần truy vấn liên quan.

Quan hệ giữa server trung tâm và 4 mảnh chi nhánh:

| Quan hệ | Khóa liên kết | Ý nghĩa |
|---|---|---|
| Trung tâm -> mảnh chi nhánh | `branchCode` | Xác định chi nhánh sở hữu dữ liệu phát sinh |
| Trung tâm -> `donations` | `campaignCode`, `branchCode` | Donation thuộc campaign hợp lệ và chi nhánh phụ trách |
| Trung tâm -> `payment_transactions` | `donationId`, `campaignCode` | Đối soát thanh toán theo donation/campaign |
| Trung tâm -> `campaign_reports` | `campaignCode`, `branchCode` | Nhận báo cáo tiến độ từ từng chi nhánh |
| Mảnh chi nhánh -> trung tâm | `campaignCode`, `branchCode`, trạng thái tổng hợp | Trả dữ liệu báo cáo, đối soát và giám sát về server trung tâm |

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

### 12.1. Bộ collection thiết kế

```javascript
use charity_distributed

db.createCollection("users")
db.createCollection("campaigns")
db.createCollection("donations")
db.createCollection("payment_transactions")
db.createCollection("campaign_reports")
db.createCollection("audit_logs")

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

db.payment_transactions.createIndex({ donationId: 1, createdAt: -1 })
db.payment_transactions.createIndex({ campaignCode: 1, createdAt: -1 })
db.payment_transactions.createIndex({ status: 1, createdAt: -1 })
db.payment_transactions.createIndex({ providerTxnId: 1 }, { sparse: true })

db.campaign_reports.createIndex({ campaignCode: 1, reportPeriod: -1 })
db.campaign_reports.createIndex({ branchCode: 1, reportPeriod: -1 })
db.campaign_reports.createIndex({ reportStatus: 1, createdAt: -1 })

db.audit_logs.createIndex({ requestId: 1 })
db.audit_logs.createIndex({ actorId: 1, createdAt: -1 })
db.audit_logs.createIndex({ resource: 1, resourceId: 1 })
db.audit_logs.createIndex({ createdAt: -1 })
```

### 12.2. Index shard key khi demo sharding

```javascript
db.donations.createIndex({ campaignCode: "hashed" })
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

Hệ thống có 2 loại admin:

- `system_admin`: admin tổng hệ thống, xem và quản trị toàn bộ dữ liệu.
- `branch_admin`: admin chi nhánh, chỉ quản trị dữ liệu trong `branchCode` được phân công.

| Chức năng | Admin tổng hệ thống | Admin chi nhánh | Staff | Donor |
|---|---:|---:|---:|---:|
| Xem campaign | Toàn hệ thống | Theo chi nhánh | Theo phân công | Public |
| Tạo campaign | Có | Có, theo chi nhánh | Có, nếu được phân quyền | Không |
| Cập nhật campaign | Có | Có, theo chi nhánh | Có, nếu được phân quyền | Không |
| Xóa campaign | Có | Không | Không | Không |
| Tạo donation | Có | Không | Không | Có |
| Xem donation | Toàn hệ thống | Theo chi nhánh | Theo phân công | Của mình/email |
| Duyệt/từ chối donation | Có | Có, theo chi nhánh | Có, nếu được phân quyền | Không |
| Quản lý payment transaction | Toàn hệ thống | Theo chi nhánh | Đối soát | Không |
| Quản lý campaign report | Toàn hệ thống | Theo chi nhánh | Lập/cập nhật | Xem public |
| Xem thống kê | Toàn hệ thống | Theo chi nhánh | Theo phân công | Public/giới hạn |
| Quản lý user | Có | User chi nhánh | Không | Không |
| Health/system | Có | Xem giới hạn | Xem giới hạn | Không |

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
Backend aggregate đọc lại số liệu mới
```

### 14.3. Xem thống kê

1. Backend đọc `campaigns` để lấy tổng số campaign.
2. Backend aggregate `donations` theo `status` và `amount`.
3. Nếu dữ liệu lớn, backend có thể tối ưu bằng cache tầng service hoặc batch aggregation, không tạo collection thống kê riêng.

Tổng tiền quyên góp chính thức chỉ tính các donation có `status = "verified"`. Các donation `pending` và `rejected` vẫn được thống kê riêng để phục vụ quản trị, nhưng không cộng vào tổng tiền đã xác nhận.

## 15. Ghi chú về phần lệch giữa ví dụ và schema hiện tại

File `apps/backend/src/common/transactions.example.ts` có một số ý tưởng mở rộng như `approvedBy`, `approvedAt`, `currentAmount`, `goalAmount`, `status = approved`. Các trường này chưa khớp hoàn toàn với model đang chạy:

| Nội dung trong ví dụ | Schema hiện tại | Cách xử lý trong tài liệu này |
|---|---|---|
| `username` trong `users` | Code demo có thể chưa có | Bổ sung vào thiết kế để tài khoản đầy đủ hơn |
| `system_admin`, `branch_admin` | Code demo có thể đang gộp `admin` | Tách thành admin tổng hệ thống và admin chi nhánh |
| `payment_transactions` | Có thể chưa có model riêng | Bổ sung để quản lý thanh toán tách khỏi donation |
| `campaign_reports` | Có thể chưa có model riêng | Bổ sung để báo cáo tiến độ/minh chứng theo chiến dịch |
| `approvedBy`, `approvedAt` | Chưa có trong `donations` | Ghi là khuyến nghị `reviewedBy`, `reviewedAt` |
| `status = approved` | Hiện dùng `verified` | Giữ `verified` theo code hiện tại |
| `goalAmount`, `currentAmount` | Hiện dùng `targetAmount`, chưa có `currentAmount` | Giữ `targetAmount`; thống kê tính động |
| `campaignCode` trong campaign | Hiện dùng `code` | Ghi rõ `campaigns.code = donations.campaignCode` |

## 16. Đánh giá thiết kế

| Tiêu chí | Đánh giá |
|---|---|
| Đúng yêu cầu thiết kế | Mở rộng thành 6 collection: `users`, `campaigns`, `donations`, `payment_transactions`, `campaign_reports`, `audit_logs` |
| Dễ triển khai | Phù hợp Express + Mongoose hiện tại |
| Dễ mở rộng | Có lộ trình thêm thanh toán, báo cáo chiến dịch, audit và reviewer fields |
| Tối ưu truy vấn chính | Có index theo `campaignCode`, `status`, `donorEmail`, `createdAt` |
| An toàn dữ liệu | Có validation, RBAC, password hash và logging |
| Phù hợp CSDLPT | Có nhân bản, failover, 5 server dữ liệu và 4 mảnh chi nhánh |

## 17. Kết luận

Thiết kế dữ liệu nên giữ `donations` làm collection trung tâm, `campaigns` làm dữ liệu nghiệp vụ nền và `users` làm lớp định danh - phân quyền. Bộ 6 collection là vừa đủ: không quá ít để thiếu nghiệp vụ thanh toán/báo cáo/audit, cũng không dư thừa so với phạm vi bài toán. Với mô hình mở rộng 6 máy, cụm dữ liệu gồm 5 server: 1 server dữ liệu tổng trung tâm và 4 server chi nhánh tương ứng 4 mảnh dữ liệu có quan hệ rõ ràng với trung tâm qua `branchCode`, `campaignCode`, `donationId` và dữ liệu báo cáo tổng hợp.
