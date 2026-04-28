# 📋 Đối chiếu yêu cầu trong đề DOCX với dự án hiện tại

Tài liệu này trả lời trực tiếp các câu hỏi trọng tâm trong đề bài của cô, để kiểm tra:

- Dự án đã làm gì
- Đã đúng mục tiêu môn Cơ sở dữ liệu phân tán chưa
- Đã mô tả trực quan việc phân tán dữ liệu trong thực tế chưa

---

## 🆕 THÔNG BÁO QUAN TRỌNG

**Yêu cầu DOCX đã được chuyển sang Markdown!**

📄 **Tệp mới:** [`11-yeu-cau-bai-tap-lon-csdlpt-chi-tiet.md`](11-yeu-cau-bai-tap-lon-csdlpt-chi-tiet.md)

✨ **Lợi ích:**
- ✅ Dễ đọc, dễ tìm kiếm
- ✅ Không cần mở DOCX nữa
- ✅ Tiết kiệm token truy cập
- ✅ Có thể reference trực tiếp trong code
- ✅ Có bảng mục lục chi tiết

📌 **Khuyến nghị:** Tham khảo File 11 thay vì DOCX gốc

---

## 1. Dự án hiện đang thực hiện gì

Dự án là hệ thống quyên góp từ thiện gồm 3 lớp chính:

- Frontend web cho người dùng công khai và quản trị
- Backend API xử lý nghiệp vụ quyên góp, chiến dịch, thống kê
- MongoDB Replica Set 3 node để lưu trữ dữ liệu theo mô hình phân tán dạng nhân bản

Nghiệp vụ đã triển khai:

- Tạo và quản lý chiến dịch quyên góp
- Tạo giao dịch quyên góp
- Duyệt hoặc từ chối giao dịch
- Thống kê tổng quan theo trạng thái và tổng tiền
- Kiểm tra sức khỏe hệ thống

## 2. Đối chiếu theo các nhóm yêu cầu thường gặp trong đề DOCX

## 2.1 Đặt vấn đề và mục tiêu dự án

Yêu cầu đề bài:

- Nêu nhu cầu và tầm quan trọng
- Nêu các nhiệm vụ chính
- Làm rõ vì sao phải dùng CSDL phân tán

Mức đáp ứng hiện tại: Đạt

Giải thích:

- Bài toán quyên góp có nhiều điểm truy cập từ nhiều máy khác nhau
- Cần tính sẵn sàng cao khi một node sự cố
- Cần tính nhất quán dữ liệu sau ghi
- Replica Set đáp ứng tốt yêu cầu sẵn sàng và đồng bộ dữ liệu

## 2.2 Phân tích chức năng truy cập dữ liệu theo vị trí

Yêu cầu đề bài:

- Chức năng chính truy cập dữ liệu
- Tần suất truy cập theo điểm đặt máy
- Vai trò máy trạm và máy chủ

Mức đáp ứng hiện tại: Đạt một phần

Phần đã có:

- Máy FE gửi yêu cầu đọc/ghi đến máy BE
- Máy BE ghi vào PRIMARY và đọc dữ liệu thống kê
- Dữ liệu nhân bản sang SECONDARY để dự phòng

Phần còn thiếu để mạnh hơn khi báo cáo:

- Chưa có bảng định lượng tần suất truy cập theo từng trạm
- Chưa có kịch bản cân bằng tải đọc từ SECONDARY

## 2.3 Phân quyền nhóm đối tượng sử dụng

Yêu cầu đề bài:

- Phân nhóm người dùng và quyền truy cập

Mức đáp ứng hiện tại: Đạt một phần

Phần đã có:

- Frontend có chế độ công khai và quản trị theo luồng giao diện

Phần còn thiếu:

- Chưa có xác thực tài khoản và phân quyền ở mức API
- Chưa có RBAC đầy đủ theo vai trò

## 2.4 Phân tích và thiết kế dữ liệu

Yêu cầu đề bài:

- Mô hình dữ liệu và liên kết giữa các thực thể
- Thiết kế lưu trữ cho CSDL phân tán

Mức đáp ứng hiện tại: Đạt ở mức nền tảng

Phần đã có:

- Mô hình dữ liệu chính gồm Campaign và Donation
- Donation tham chiếu campaignCode
- Chỉ mục đã có để tăng tốc truy vấn

Phần còn thiếu so với mức báo cáo xuất sắc:

- Chưa có tài liệu ERD chính thức kèm giải thích ràng buộc nghiệp vụ
- Chưa có phần phân mảnh dữ liệu kiểu ngang/dọc rõ ràng

## 2.5 Thiết kế CSDL phân tán: phân mảnh, định vị, ánh xạ

Yêu cầu đề bài:

- Nêu chiến lược phân mảnh hoặc nhân bản
- Sơ đồ định vị dữ liệu
- Lược đồ ánh xạ dữ liệu giữa các vị trí

Mức đáp ứng hiện tại: Đạt một phần quan trọng

Phần đã có:

- Nhân bản dữ liệu theo Replica Set 3 node
- Định vị node qua Tailscale IP
- Failover tự động khi PRIMARY gặp sự cố

Phần chưa đạt đầy đủ nếu cô yêu cầu chặt về phân mảnh:

- Chưa triển khai sharding hoặc phân mảnh ngang theo vùng/cụm chiến dịch
- Chưa có tài liệu ánh xạ phân mảnh chi tiết theo site

Kết luận mục này:

- Dự án đã làm tốt nhánh nhân bản phân tán
- Nếu đề bắt buộc cả phân mảnh, cần bổ sung thêm phương án phân mảnh logic hoặc mô phỏng phân mảnh

## 2.6 Kiến trúc hệ thống phân tán

Yêu cầu đề bài:

- Nêu kiểu kiến trúc ngang hàng hoặc Client/Server
- Mô tả mạng kết nối thực tế

Mức đáp ứng hiện tại: Đạt

Thực tế dự án:

- Kiến trúc Client/Server
- Kết nối đa máy qua Tailscale
- Dữ liệu lưu trên MongoDB Replica Set nhiều máy

## 2.7 Bảo vệ dữ liệu, nhập liệu, hiển thị, thống kê

Yêu cầu đề bài:

- Cơ chế bảo vệ
- Nhập dữ liệu
- Hiển thị dữ liệu và kiểm tra đồng bộ
- Thống kê đối chiếu

Mức đáp ứng hiện tại: Đạt một phần lớn

Phần đã có:

- Backend có security headers, CORS, giới hạn body, validation
- FE có luồng nhập và hiển thị dữ liệu thực
- API thống kê tổng quan hoạt động

Phần nên bổ sung để hoàn chỉnh hơn:

- Bảo mật mức DB: user/password, role tối thiểu, IP allowlist
- Nhật ký truy cập và theo dõi lỗi tập trung
- Kịch bản transaction nhiều bước nếu nghiệp vụ phát sinh

## 3. Mô tả trực quan phân tán dữ liệu trong thực tế

## 3.1 Sơ đồ triển khai 6 máy

Mô hình vận hành thực tế:

- Máy 5 (Frontend) gửi request tới Máy 4 (Backend)
- Máy 4 ghi vào PRIMARY của Replica Set
- PRIMARY đồng bộ dữ liệu sang 2 SECONDARY
- Khi PRIMARY hỏng, hệ thống bầu PRIMARY mới

Sơ đồ chữ:

[User/Browser]
    |
    v
[Máy 5 - Frontend]
    |
    v
[Máy 4 - Backend API]
    |
    v
[Replica Set rsCharity]
    |-- [Máy 1 - Node A]
    |-- [Máy 2 - Node B]
    |-- [Máy 3 - Node C]

Luồng ghi dữ liệu:

- FE gửi tạo donation
- BE ghi vào PRIMARY
- PRIMARY commit và đẩy oplog sang SECONDARY
- SECONDARY đồng bộ theo thời gian thực gần đúng

Luồng failover:

- PRIMARY dừng
- Hai node còn lại bầu cử
- Một node lên PRIMARY
- BE tiếp tục ghi lên PRIMARY mới

## 3.2 Cách chứng minh phân tán dữ liệu khi demo

Trên mongosh:

- rs.status()
- rs.printReplicationInfo()
- rs.printSecondaryReplicationInfo()

Kịch bản demo tối thiểu:

1. Tạo donation từ FE
2. Kiểm tra dữ liệu xuất hiện qua API
3. Dừng node PRIMARY
4. Chờ bầu PRIMARY mới
5. Tạo donation lần 2
6. Xác nhận hệ thống vẫn chạy

Điều này chứng minh:

- Dữ liệu không phụ thuộc một máy duy nhất
- Có nhân bản và chuyển vai trò tự động
- Hệ thống có tính sẵn sàng khi sự cố

## 4. Kết luận tổng thể: có đúng mục đích cô yêu cầu không

Kết luận ngắn gọn:

- Đúng hướng và đúng mục tiêu chính của CSDL phân tán ở nhánh nhân bản dữ liệu, sẵn sàng cao, failover thực tế
- Chưa đạt mức tối đa nếu đề yêu cầu bắt buộc cả phân mảnh dữ liệu chi tiết

Đánh giá mức độ phù hợp:

- Mục tiêu hệ thống web + CSDL phân tán đa máy: Đạt
- Mạng ảo liên máy để triển khai thực tế: Đạt
- Minh họa trực quan luồng dữ liệu phân tán: Đạt
- Phân mảnh dữ liệu chuyên sâu: Chưa đầy đủ

## 5. Đề xuất bổ sung để đạt mức báo cáo mạnh hơn

Nếu nhóm muốn nâng cấp để “đúng đề rất chặt” và tăng điểm thuyết trình:

- Bổ sung một mục phân mảnh ngang theo khu vực hoặc theo mã chiến dịch
- Viết bảng ánh xạ dữ liệu theo site rõ ràng
- Bổ sung ERD chính thức và ma trận truy cập theo từng trạm
- Bổ sung xác thực và phân quyền API
- Bổ sung script đo độ trễ đồng bộ giữa các node

Khi bổ sung các mục này, bài sẽ thể hiện rõ hơn chiều sâu “phân tán dữ liệu trong thực tế”, không chỉ dừng ở mức nhân bản dự phòng.
