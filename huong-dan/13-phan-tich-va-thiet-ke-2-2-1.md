# 2.2.1 Phân Tích - Dự Án Quyên Góp Từ Thiện Phân Tán

Tài liệu này được viết riêng cho mục 2.2.1 trong phần báo cáo thực hành, dựa trên dự án hiện tại: hệ thống Charity Distributed Platform chạy trên mô hình 6 máy, Leader chạy FE + BE + QA + mongos + cfg1, dữ liệu lưu trên MongoDB Sharded Cluster.

---

## A. Phân tích chức năng truy cập dữ liệu

### A.1 Các chức năng chính truy cập vào dữ liệu trong dự án

Hệ thống hiện tại có các nhóm chức năng truy cập dữ liệu chính sau:

- Quản lý chiến dịch: tạo, sửa, xoá, xem danh sách chiến dịch.
- Quản lý donation: tạo donation, duyệt donation, từ chối donation, xem chi tiết donation.
- Quản lý thống kê: xem tổng tiền, số lượng donation, số chiến dịch, số người quyên góp.
- Quản lý người dùng: đăng ký, đăng nhập, xem thông tin tài khoản, phân quyền.
- Kiểm tra vận hành: health check, replication status, backup/restore, failover.

Các chức năng này phát sinh truy cập dữ liệu ở cả frontend, backend, và tầng MongoDB phân tán.

### A.2 Bảng tần suất truy cập tại các vị trí

Bảng dưới đây mô tả mức độ truy cập tương đối theo vị trí trong hệ thống.

| Vị trí | Nhóm chức năng | Tần suất | Ghi chú |
|---|---|---:|---|
| Frontend công khai | Xem chiến dịch, tạo donation | Cao | Tương tác trực tiếp từ người dùng donor |
| Frontend quản trị | Duyệt donation, quản lý chiến dịch | Trung bình - Cao | Chủ yếu staff/admin |
| Backend API | CRUD nghiệp vụ, validate, authorize | Rất cao | Là lớp trung gian truy cập DB |
| Mongos trên Leader | Định tuyến query đến shard | Rất cao | Luôn đứng giữa backend và cluster |
| Shard lưu donation | Ghi donation, truy vấn theo campaignCode | Rất cao | Điểm nóng của dữ liệu nghiệp vụ |
| Config server | Lưu metadata sharding | Thấp - Trung bình | Chủ yếu đọc/ghi metadata |
| QA / backup machine | Kiểm tra failover, dump/restore | Thấp | Chỉ chạy theo lịch demo / kiểm thử |

### A.3 Mẫu truy cập theo loại dữ liệu

- Campaign: đọc nhiều, ghi ít hơn donation.
- Donation: ghi liên tục, đọc theo chiến dịch, trạng thái, khoảng thời gian.
- User: đọc/ghi ít hơn, nhưng yêu cầu bảo mật cao.
- Stat: đọc nhiều, ghi theo batch hoặc sau khi có thay đổi nghiệp vụ.

### A.4 Kỹ thuật phân tích truy cập để phục vụ thiết kế

Từ tần suất truy cập thực tế, có thể rút ra:

- Donation là thực thể phát sinh tải lớn nhất, nên cần phân tán tốt.
- Truy vấn thường gắn với campaignCode, nên shard key phải tối ưu cho truy cập theo chiến dịch.
- Dữ liệu thống kê nên tổng hợp từ donation và campaign, có thể dùng pipeline / query tối ưu.
- Người dùng và quyền truy cập nên tách khỏi dữ liệu nghiệp vụ để giảm rủi ro bảo mật.

---

## B. Phân quyền cho các nhóm đối tượng

### B.1 Các nhóm đối tượng trong hệ thống

- Admin: quản trị toàn hệ thống.
- Staff: xử lý nghiệp vụ quyên góp.
- Donor: người quyên góp.
- QA/Leader: kiểm thử, giám sát và backup/restore.

### B.2 Ma trận phân quyền tổng quát

| Đối tượng | Campaign | Donation | Stat | User | System |
|---|---|---|---|---|---|
| Admin | CRUD | CRUD + duyệt/từ chối | Read | CRUD | Health, audit |
| Staff | CRU | Create, Read, Approve, Reject | Read | Read hạn chế | Health |
| Donor | Read | Create, Read own | Read public | Read profile | Không |
| QA/Leader | Read | Read test data | Read | Read test data | Backup, restore, failover |

### B.3 Phân quyền theo nghiệp vụ hiện tại

- Admin có toàn quyền đối với chiến dịch, donation và người dùng.
- Staff có quyền xử lý chiến dịch và donation nhưng không có quyền quản trị toàn hệ thống.
- Donor chỉ được xem dữ liệu công khai và tạo donation.
- QA/Leader có quyền vận hành và kiểm thử, không can thiệp nghiệp vụ trực tiếp ngoài phạm vi test.

### B.4 Liên hệ với RBAC trong dự án

Dự án hiện đã triển khai RBAC ở backend với các nhóm quyền tương ứng:

- `admin`: toàn quyền.
- `staff`: quyền xử lý nghiệp vụ trung gian.
- `donor`: quyền hạn chế, chủ yếu đọc và tạo donation.

Điều này giúp kiểm soát chặt dữ liệu trong hệ thống phân tán, tránh người dùng truy cập vượt quyền.

---

## C. Phân tích chức năng của từng vị trí triển khai

### C.1 Chức năng tại máy trạm / frontend

Máy trạm là nơi người dùng tương tác với giao diện web.

Chức năng chính:

- Xem danh sách chiến dịch.
- Xem chi tiết chiến dịch.
- Tạo donation.
- Theo dõi trạng thái donation.
- Xem dashboard / thống kê công khai.
- Đăng nhập, đăng ký nếu được cấp quyền.

Dữ liệu trao đổi tại máy trạm chủ yếu là dữ liệu đầu vào và hiển thị, không lưu nghiệp vụ cục bộ.

### C.2 Chức năng tại máy chủ ứng dụng / backend

Backend trên Leader thực hiện:

- Nhận request từ frontend.
- Xác thực JWT.
- Kiểm tra RBAC.
- Validate input.
- Thực hiện nghiệp vụ tạo/sửa/duyệt donation.
- Ghi log và audit.
- Truy cập MongoDB qua mongos.

Đây là lớp quyết định tính an toàn và toàn vẹn của dữ liệu.

### C.3 Chức năng tại tầng dữ liệu phân tán

Tầng dữ liệu gồm cfgRS, rsShardA, rsShardB và mongos.

- Config server lưu metadata sharding.
- Mongos định tuyến truy vấn.
- Shard A và Shard B lưu dữ liệu nghiệp vụ.
- Mỗi shard là 1 Replica Set để đảm bảo sẵn sàng cao.

### C.4 Ý nghĩa của việc phân tách vị trí

Tách rõ frontend, backend và database giúp:

- Dễ mở rộng.
- Dễ kiểm thử.
- Dễ mô phỏng failover.
- Phù hợp với môi trường nhiều máy trong môn CSDLPT.

---

## D. Phân tích cơ sở dữ liệu

### D.1 Mô hình thực thể liên kết

Các thực thể chính trong dự án:

- User: tài khoản hệ thống.
- Campaign: chiến dịch quyên góp.
- Donation: giao dịch quyên góp.
- Stat: dữ liệu thống kê.

### D.2 Quan hệ giữa các thực thể

- User tạo nhiều Campaign.
- User tạo nhiều Donation.
- Campaign có nhiều Donation.
- Campaign và Donation đều liên quan đến Stat.

### D.3 Các bảng dữ liệu chính

- `users`
- `campaigns`
- `donations`
- `stats`

### D.4 Đặc điểm dữ liệu thực tế

- `users`: ít thay đổi, cần bảo mật cao.
- `campaigns`: thay đổi theo nghiệp vụ, số lượng vừa phải.
- `donations`: phát sinh nhiều nhất, tăng nhanh nhất, cần phân mảnh hợp lý.
- `stats`: chủ yếu tổng hợp và đọc.

### D.5 Kết luận thiết kế dữ liệu

Từ phân tích trên, có thể thấy:

- Donation là điểm nóng chính của hệ thống.
- campaignCode là thuộc tính truy cập rất thường xuyên.
- Dữ liệu nên được shard theo campaignCode hashed để cân bằng tải.
- User và Stat nên giữ thiết kế gọn, dễ truy vấn và dễ bảo vệ.

---

## Kết luận chung mục 2.2.1

Phân tích cho thấy dự án quyên góp từ thiện của nhóm có đầy đủ đặc điểm để áp dụng CSDL phân tán: truy cập nhiều máy, dữ liệu phát sinh lớn, yêu cầu sẵn sàng cao, cần phân quyền rõ ràng và cần tối ưu truy vấn theo nghiệp vụ. Vì vậy, việc phân tích truy cập dữ liệu, phân quyền, vị trí triển khai và mô hình dữ liệu là bước nền tảng để chuyển sang phần thiết kế ở mục 2.2.2.
