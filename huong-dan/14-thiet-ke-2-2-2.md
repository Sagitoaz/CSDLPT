# 2.2.2 Thiết Kế - Dự Án Quyên Góp Từ Thiện Phân Tán

Tài liệu này được viết riêng cho mục 2.2.2 trong phần báo cáo thực hành, dựa trên dự án hiện tại: Charity Distributed Platform chạy trên mô hình 6 máy, Leader chạy FE + BE + QA + mongos + cfg1, dữ liệu lưu trên MongoDB Sharded Cluster.

---

## A. Thiết kế CSDL quan hệ

### A.1 Tên bảng và danh sách thực thể chính

Trong dự án hiện tại, mô hình dữ liệu logic được quy về 4 thực thể chính:

- `users`
- `campaigns`
- `donations`
- `stats`

Đây là bộ bảng cốt lõi phục vụ toàn bộ nghiệp vụ quyên góp, xác thực, thống kê và vận hành.

### A.2 Cấu trúc chi tiết các bảng dữ liệu

#### 1. Bảng `users`

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `_id` | ObjectId | PK | Khóa chính |
| `email` | String | Unique, Required, Indexed | Email đăng nhập |
| `password` | String | Required | Mật khẩu đã hash |
| `fullName` | String | Required | Họ tên |
| `role` | String | Enum(admin, staff, donor) | Vai trò |
| `isActive` | Boolean | Default true | Trạng thái hoạt động |
| `createdAt` | Date | Auto | Thời điểm tạo |
| `updatedAt` | Date | Auto | Thời điểm cập nhật |

#### 2. Bảng `campaigns`

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `_id` | ObjectId | PK | Khóa chính |
| `campaignCode` | String | Unique, Required, Indexed | Mã chiến dịch |
| `title` | String | Required | Tên chiến dịch |
| `description` | String | Required | Mô tả |
| `goalAmount` | Number | Required | Mục tiêu cần quyên góp |
| `currentAmount` | Number | Default 0 | Số tiền đã nhận |
| `status` | String | Enum(active, paused, completed) | Trạng thái |
| `createdBy` | ObjectId | FK -> users._id | Người tạo |
| `startDate` | Date | Required | Ngày bắt đầu |
| `endDate` | Date | Required | Ngày kết thúc |
| `createdAt` | Date | Auto | Thời điểm tạo |
| `updatedAt` | Date | Auto | Thời điểm cập nhật |

#### 3. Bảng `donations`

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `_id` | ObjectId | PK | Khóa chính |
| `campaignCode` | String | Required, Indexed | Mã chiến dịch |
| `donorId` | ObjectId | FK -> users._id | Người quyên góp |
| `amount` | Number | Required, Min 1 | Số tiền quyên góp |
| `donorName` | String | Required | Tên người quyên góp |
| `donorEmail` | String | Required | Email người quyên góp |
| `status` | String | Enum(pending, verified, rejected) | Trạng thái duyệt |
| `notes` | String | Optional | Ghi chú |
| `approvedAt` | Date | Optional | Thời điểm duyệt |
| `approvedBy` | ObjectId | FK -> users._id | Người duyệt |
| `createdAt` | Date | Auto | Thời điểm tạo |
| `updatedAt` | Date | Auto | Thời điểm cập nhật |

#### 4. Bảng `stats`

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `_id` | ObjectId | PK | Khóa chính |
| `type` | String | Enum(campaign, donation) | Loại thống kê |
| `campaignCode` | String | Indexed | Mã chiến dịch liên quan |
| `totalDonations` | Number | Default 0 | Tổng số giao dịch |
| `totalAmount` | Number | Default 0 | Tổng tiền |
| `donorCount` | Number | Default 0 | Số người quyên góp |
| `status` | String | Optional | Trạng thái thống kê |
| `calculatedAt` | Date | Auto | Thời điểm tính |

### A.3 Mối quan hệ giữa các bảng

Quan hệ chính trong hệ thống:

- Một `user` có thể tạo nhiều `campaigns`.
- Một `user` có thể tạo nhiều `donations`.
- Một `campaign` có thể có nhiều `donations`.
- Một `campaign` có thể có nhiều bản ghi `stats` theo mục đích thống kê.
- Một `donation` có thể được duyệt bởi một `user` có vai trò staff hoặc admin.

Mối quan hệ này phản ánh đúng luồng nghiệp vụ của hệ thống quyên góp.

### A.4 Sơ đồ ER mô tả bằng văn bản

- `users (1) ---- (N) campaigns`
- `users (1) ---- (N) donations`
- `campaigns (1) ---- (N) donations`
- `campaigns (1) ---- (N) stats`
- `users (1) ---- (N) donations` thông qua `approvedBy`

### A.5 Phân tích theo dữ liệu thực tế

Dựa trên dự án hiện tại:

- `users` có số lượng không lớn nhưng yêu cầu bảo mật và ràng buộc chặt.
- `campaigns` có số lượng trung bình, thay đổi theo đợt phát động.
- `donations` là bảng phát sinh nhiều nhất, tăng nhanh nhất và cần xử lý đồng thời cao.
- `stats` chủ yếu là dữ liệu tổng hợp, đọc nhiều hơn ghi.

Về volume dữ liệu:

- `donations` là bảng có tốc độ tăng lớn nhất.
- `campaigns` tăng chậm hơn và đóng vai trò dữ liệu tham chiếu.
- `users` ổn định hơn, nhưng cần chỉ mục tốt cho email và role.
- `stats` có thể được tạo theo batch hoặc theo sự kiện nghiệp vụ.

### A.6 Kết luận phần CSDL quan hệ

Thiết kế quan hệ ở mức logic cho dự án này tập trung vào 4 bảng chính, trong đó donation là thực thể giao dịch trung tâm. Cấu trúc này đủ rõ ràng để triển khai bằng MongoDB hoặc quy chiếu sang mô hình quan hệ khi cần mô tả trong báo cáo.

---

## B. Thiết kế CSDL phân tán

### B.1 Lược đồ thông tin phục vụ phân mảnh

Trong dự án hiện tại, thông tin phục vụ phân mảnh được xác định từ nghiệp vụ truy cập:

- Donation truy cập nhiều nhất.
- Query thường gắn với `campaignCode`.
- Thống kê thường theo chiến dịch.
- User và campaign đóng vai trò dữ liệu nền.

Từ đó, lược đồ thông tin phục vụ phân mảnh gồm:

- `campaignCode`
- `donorId`
- `createdAt`
- `status`
- `amount`

### B.1.1 Phân mảnh ngang dẫn xuất

Với mô hình thực tế của dự án, collection `donations` là ứng viên chính cho phân mảnh ngang dẫn xuất.

- Phân mảnh theo `campaignCode`.
- Các document donation của cùng chiến dịch nên có khả năng được route tới cùng nhóm chunk hoặc cùng vùng logic.
- Điều này giúp truy vấn theo chiến dịch hiệu quả hơn.

### B.1.2 Nhân bản

Các thành phần được nhân bản trong dự án:

- Config server: 3 node.
- Shard A: 3 node.
- Shard B: 3 node.

Mục tiêu của nhân bản:

- Tăng khả năng chịu lỗi.
- Tăng độ sẵn sàng khi một node down.
- Cho phép failover tự động.

### B.1.3 Phân mảnh dọc

Trong dự án này, phân mảnh dọc không phải kỹ thuật chính cho dữ liệu nghiệp vụ, nhưng có thể dùng về mặt thiết kế báo cáo để tách:

- Thông tin đăng nhập và bảo mật của `users`.
- Thông tin hồ sơ hiển thị của `users`.
- Thông tin giao dịch của `donations`.

Tuy nhiên, trong triển khai hiện tại, mô hình chính vẫn là phân mảnh ngang theo `campaignCode`.

### B.2 Thiết kế định vị (Localization)

#### B.2.1 Vị trí lưu trữ các fragment / shard

Theo kiến trúc hiện tại:

- `cfgRS`: lưu metadata sharding.
- `rsShardA`: lưu một phần dữ liệu `donations` và dữ liệu liên quan.
- `rsShardB`: lưu phần còn lại của dữ liệu `donations` và dữ liệu liên quan.

#### B.2.2 Sơ đồ định vị mô tả bằng văn bản

- Leader chạy `mongos` làm điểm vào duy nhất.
- `mongos` đọc metadata từ `cfgRS`.
- `mongos` gửi query đến `rsShardA` hoặc `rsShardB` theo chunk mapping.

### B.3 Lược đồ ánh xạ (Mapping Schema)

#### B.3.1 Từ global schema sang local schema

Global schema của hệ thống gồm:

- `users`
- `campaigns`
- `donations`
- `stats`

Ánh xạ local trong môi trường phân tán:

- `users` và `campaigns` có thể được truy vấn qua `mongos`, nhưng không phải đối tượng shard chính.
- `donations` là collection chính được shard.
- `stats` có thể sinh ra từ query tổng hợp trên dữ liệu phân tán.

#### B.3.2 Từng vị trí lưu trữ

- Leader: entry point ứng dụng, không lưu dữ liệu nghiệp vụ cục bộ chính.
- `rsShardA`: một phần dữ liệu donation theo shard key.
- `rsShardB`: phần còn lại của dữ liệu donation theo shard key.

### B.4 Thiết kế kiến trúc hệ thống

| Khía cạnh | Thiết kế trong dự án hiện tại |
|---|---|
| Kiểu QTLPT | Client/Server kết hợp sharded cluster |
| Đường đồng bộ hóa | Replica Set nội bộ trong từng shard và cfgRS |
| Linked Server | Không dùng SQL Server Linked Server, thay bằng mongos và shard routing |
| Mô hình toàn hệ thống | FE + BE + QA trên Leader, DB phân tán trên 6 máy |

### B.4.1 Kiến trúc thực tế theo 6 máy

- Máy 1: FE + BE + QA + mongos + cfg1.
- Máy 2: cfg2 + shardA1.
- Máy 3: cfg3 + shardA2.
- Máy 4: shardA3 + shardB1.
- Máy 5: shardB2.
- Máy 6: shardB3.

### B.4.2 Lý do chọn kiến trúc này

- Mô phỏng gần thực tế nhất trong điều kiện 6 máy.
- Leader vừa điều phối ứng dụng vừa điều phối kiểm thử.
- Cả 6 máy đều tham gia DB, không máy nào “đứng ngoài”.
- Mỗi shard là một Replica Set nên vừa có phân tán vừa có nhân bản.
- Có thể demo failover, backup/restore và phân phối dữ liệu rõ ràng.

### B.4.3 Lý do shard theo campaignCode hashed

- CampaignCode là khóa nghiệp vụ quan trọng, xuất hiện thường xuyên trong truy vấn.
- Dùng hashed giúp phân bổ tải đều hơn giữa các shard.
- Tránh một chiến dịch có quá nhiều donation làm nóng một shard.
- Phù hợp với cách hệ thống của nhóm đang hoạt động và dễ giải thích trong báo cáo.

### B.4.4 Kết luận phần thiết kế phân tán

Thiết kế phân tán của dự án hiện tại đáp ứng đủ các nội dung cần trình bày trong báo cáo: phân mảnh, nhân bản, định vị, ánh xạ và kiến trúc toàn hệ thống. Trong thực tế, `donations` là đối tượng chính để shard, `campaignCode` là shard key hợp lý nhất, và `mongos` là lớp định tuyến trung tâm để các máy khách không cần biết dữ liệu nằm ở shard nào.

---

## Kết luận chung mục 2.2.2

Phần thiết kế của dự án đã xác định rõ cấu trúc dữ liệu cốt lõi, cách ánh xạ các thực thể vào mô hình phân tán, và cách triển khai thực tế trên 6 máy. Điều này tạo nền tảng cho việc cài đặt vật lý, kiểm thử và demo failover trong các bước tiếp theo của báo cáo.
