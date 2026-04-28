# 2.1 Đặt Vấn Đề - Dự Án Quyên Góp Từ Thiện Phân Tán

## 2.1.1 Nhu cầu và tầm quan trọng của dự án

Dự án hiện tại là một hệ thống quyên góp từ thiện phân tán, cho phép người dùng tạo chiến dịch, tiếp nhận donation, duyệt giao dịch, xem thống kê và theo dõi trạng thái hệ thống. Đây là một bài toán phù hợp với môn Cơ sở dữ liệu phân tán vì dữ liệu không chỉ cần được lưu trữ tập trung mà còn phải phục vụ truy cập từ nhiều máy, nhiều vai trò và có yêu cầu sẵn sàng cao.

Hệ thống này giải quyết các vấn đề sau:

- Quản lý nhiều chiến dịch quyên góp cùng lúc, mỗi chiến dịch có thể phát sinh rất nhiều giao dịch donation.
- Cho phép người dùng truy cập từ nhiều máy khác nhau qua Tailscale mà vẫn đảm bảo dữ liệu nhất quán.
- Hỗ trợ kiểm thử failover, backup/restore và đồng bộ hóa để mô phỏng môi trường triển khai thực tế.
- Tách biệt rõ lớp giao diện, lớp xử lý nghiệp vụ và lớp lưu trữ dữ liệu để dễ mở rộng và bảo trì.

Lý do cần sử dụng CSDL phân tán trong dự án này:

- Dữ liệu phát sinh từ nhiều nguồn truy cập đồng thời, không thể chỉ phụ thuộc vào một máy đơn lẻ.
- Nếu một node lưu trữ gặp sự cố, hệ thống vẫn cần tiếp tục hoạt động nhờ cơ chế Replica Set và Sharded Cluster.
- Dữ liệu donation có thể tăng nhanh theo thời gian, cần cơ chế phân mảnh để phân phối tải đều hơn.
- Bài toán có yêu cầu thực nghiệm rõ ràng: kiểm tra đồng bộ, failover, backup, restore và phân phối dữ liệu trên nhiều máy.

Nói ngắn gọn, đây không chỉ là một ứng dụng web quyên góp thông thường mà là một mô hình minh họa đầy đủ cho các khái niệm chính của CSDLPT: nhân bản, phân mảnh, định vị dữ liệu, đồng bộ hóa và tính sẵn sàng của hệ thống.

## 2.1.2 Sơ lược về dự án

Dự án của nhóm là **Charity Distributed Platform** - hệ thống quyên góp từ thiện chạy trên mô hình 6 máy.

### Một số nhiệm vụ chính cần thực hiện

- Quản lý chiến dịch quyên góp.
- Tạo, duyệt, từ chối và theo dõi donation.
- Thống kê tổng tiền, số lượng giao dịch và trạng thái chiến dịch.
- Quản lý người dùng theo vai trò admin, staff, donor.
- Kiểm tra health, replication, failover và backup/restore của hệ thống.

### Nhu cầu cần dùng CSDLPT

- Máy Leader chạy đồng thời FE, BE, mongos và QA để điều phối hệ thống.
- Dữ liệu nghiệp vụ được lưu trong MongoDB Sharded Cluster, trong đó mỗi shard là một Replica Set.
- Collection donation được shard theo campaignCode dạng hashed để cân bằng tải.
- Cơ chế phân tán giúp dữ liệu có thể mở rộng và vẫn duy trì được khả năng truy cập khi có node hỏng.

### Vị trí triển khai dự án

- Máy 1: Leader, chạy FE + BE + QA + mongos + cfg1.
- Máy 2: cfg2 + shardA1.
- Máy 3: cfg3 + shardA2.
- Máy 4: shardA3 + shardB1.
- Máy 5: shardB2.
- Máy 6: shardB3.

### Nhiệm vụ và loại dữ liệu

- Dữ liệu người dùng: tài khoản, vai trò, trạng thái hoạt động.
- Dữ liệu chiến dịch: mã chiến dịch, tiêu đề, mô tả, mục tiêu, trạng thái.
- Dữ liệu donation: mã chiến dịch, người quyên góp, số tiền, trạng thái duyệt.
- Dữ liệu thống kê: tổng tiền, tổng giao dịch, số người quyên góp.
- Dữ liệu vận hành: log, health check, replication status, backup/restore.

### Các đối tượng tham gia / sử dụng

- Admin: quản trị toàn hệ thống, quản lý người dùng và duyệt nghiệp vụ.
- Staff: xử lý chiến dịch, kiểm tra donation, hỗ trợ vận hành.
- Donor: xem chiến dịch công khai và tạo donation.
- QA/Leader: kiểm tra toàn bộ luồng hoạt động, failover, backup/restore và đồng bộ dữ liệu.

## 2.1.3 Kết luận ngắn

Dự án này có ý nghĩa rõ ràng cho môn CSDLPT vì nó thể hiện được đầy đủ các vấn đề thực tế của một hệ thống dữ liệu phân tán: nhiều máy tham gia, nhiều vai trò truy cập, cần nhân bản, cần phân mảnh, cần định vị dữ liệu và cần duy trì hoạt động khi có sự cố. Vì vậy, dự án không chỉ phù hợp để xây dựng một ứng dụng web quyên góp mà còn phù hợp để minh họa các kỹ thuật cốt lõi của cơ sở dữ liệu phân tán.
