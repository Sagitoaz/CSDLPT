# 📋 BÀI TẬP LỚN MÔN CSDL PHÂN TÁN (CSDLPT)

**Năm học:** 2026  
**Hình thức:** Nhóm (7 nhóm/lớp; 10 bạn/nhóm lớp thường; 3-4 bạn/nhóm CLC)  
**Cấu trúc:** Lý thuyết + Bài tập thực hành

---

## 📚 PHẦN I: LÝ THUYẾT

### Cấu trúc báo cáo lý thuyết
- Dịch slide tiếng Anh sang tiếng Việt (lớp thường)
- Có thể bổ sung thêm nội dung để báo cáo phong phú
- **Tiến hành:** Mỗi kíp 3 nhóm báo cáo

---

## 🎯 PHÂN CÔNG NHÓM LÝ THUYẾT

### **Nhóm 1: NoSQL, newSQL, Polystores**
**Nội dung:**
- Lý thuyết và ví dụ
- Khái niệm, đặc điểm, ưu nhược điểm
- So sánh các công nghệ

### **Nhóm 2: MongoDB**
**Nội dung:**
- Lý thuyết và ví dụ
- **Nhân bản trong MongoDB**
- **Phân mảnh trong MongoDB**
- **Tạo trigger trong MongoDB**
- **Tạo Transaction trong MongoDB**
- Ví dụ tạo giao tác tập trung & giao tác phân tán trên MongoDB

### **Nhóm 3: Big Data**
**Nội dung:**
- Lý thuyết và ví dụ
- **Công nghệ xử lý BigData** (chọn 1 công nghệ cụ thể)

### **Nhóm 4: Truy vấn và Tối ưu hóa Truy vấn**
**Nội dung:**
- Tập trung và phân tán
- Lý thuyết và ví dụ
- Kỹ thuật tối ưu hóa

### **Nhóm 5: Replication (Nhân bản)**
**Nội dung:**
- Lý thuyết
- Các mô hình nhân bản
- Chiến lược đồng bộ hóa

### **Nhóm 6: Peer-to-Peer Data Management**
**Nội dung:**
- Lý thuyết và ví dụ
- **Blockchain** (nếu có)
- Quản lý dữ liệu ngang hàng

### **Nhóm 7: Transaction (Giao tác)**
**Nội dung:**

#### 7.1 Các tính chất của giao tác
- ACID properties

#### 7.2 Mục tiêu của quản lý giao tác

#### 7.3 Các sự cố và quy trình phục hồi
- Khi gặp sự cố
- Cách khôi phục giao tác phân tán

#### 7.4 Ví dụ thực tế
- Cách tạo giao tác trên SQL Server
- Ví dụ tạo giao tác **tập trung** trên SQL Server
- Ví dụ tạo giao tác **phân tán** trên SQL Server

#### 7.5 Giao thức ủy thác
- Giao thức 2 pha (Two-Phase Commit - 2PC)
- Giao thức 3 pha (Three-Phase Commit - 3PC)

---

## 💻 PHẦN II: BÀI TẬP THỰC HÀNH

### 📋 1. Lựa chọn đề tài bài tập

**Gợi ý các chủ đề:**
- Đăng ký tín chỉ
- Quản lý vật tư
- Quản lý bán vé máy bay
- *(Các đề tài khác tương tự)*

**Tiêu chí lựa chọn:**
- Có yêu cầu sử dụng **CSDL phân tán** thực sự
- Đủ phức tạp để minh họa các khái niệm CSDLPT

---

### 📝 2. Viết tài liệu báo cáo

#### **2.1 Đặt vấn đề**

**2.1.1 Nhu cầu và tầm quan trọng của dự án**
- Giải quyết vấn đề gì?
- Tại sao cần thiết sử dụng CSDLPT?

**2.1.2 Sơ lược về dự án**
- Một số nhiệm vụ chính cần thực hiện
- **Nhu cầu cần dùng CSDLPT** (làm nổi bật)
- Vị trí triển khai dự án
- Nhiệm vụ và loại dữ liệu
- Các đối tượng tham gia / sử dụng

---

#### **2.2 Phân tích và Thiết kế**

##### **2.2.1 Phân tích**

**A. Phân tích chức năng truy cập dữ liệu**
- Các chức năng chính truy cập vào dữ liệu trong dự án
- **Bảng tần suất truy cập** tại các vị trí
- Sử dụng **thuật toán phân mảnh**
- Sử dụng **kỹ thuật định vị**
- ⟹ Phục vụ cho thiết kế

**B. Phân quyền cho các nhóm đối tượng**
- Xác định quyền hạn cho mỗi nhóm đối tượng
- Ma trận phân quyền

**C. Phân tích chức năng của từng vị trí triển khai**
- Chức năng tại máy trạm (Workstation)
- Chức năng tại máy chủ (Server)

**D. Phân tích cơ sở dữ liệu**
- Mô hình thực thể liên kết (Entity-Relationship Model)
- Các bảng dữ liệu chính

---

##### **2.2.2 Thiết kế**

**A. Thiết kế CSDL quan hệ (Relational Database Design)**

- **Tên bảng** và danh sách
- **Cấu trúc chi tiết** các bảng dữ liệu:
  - Tên cột
  - Kiểu dữ liệu
  - Ràng buộc (PK, FK, NOT NULL, etc.)
  
- **Mối quan hệ giữa các bảng**
  - Sơ đồ ER (Diagram)
  - Mô tả chi tiết

- **Phân tích theo dữ liệu thực tế**
  - Đánh giá volume dữ liệu
  - Dự báo tăng trưởng

---

**B. Thiết kế CSDL Phân tán (Distributed Database Design)**

**B.1 Lược đồ thông tin phục vụ phân mảnh**
- **Phân mảnh ngang dẫn xuất** (Derived Horizontal Fragmentation)
- **Nhân bản** (Replication)
- **Phân mảnh dọc** (Vertical Fragmentation)

**B.2 Thiết kế định vị (Localization)**
- Xác định vị trí lưu trữ mỗi fragment
- Vẽ **sơ đồ định vị** (Localization Schema)

**B.3 Lược đồ ánh xạ (Mapping Schema)**
- Ánh xạ từ global schema sang local schema
- Từng vị trí lưu trữ

**B.4 Thiết kế Kiến trúc hệ thống**

| Khía cạnh | Chi tiết |
|----------|---------|
| **Kiểu QTLPT** | Ngang hàng (Peer-to-Peer) hoặc Client/Server |
| **Đường đồng bộ hóa** | Định nghĩa đường truyền + công cụ |
| **Linked Server** | Cấu hình nếu dùng SQL Server |
| **Mô hình toàn hệ thống** | Frontend + Backend ở chi nhánh và toàn bộ |

---

### 🔧 3. Cài đặt vật lý thực tế

#### **3.1 Cài đặt VPN (Mạng ảo)**

**Mục đích:** 
- Thiết lập môi trường mạng
- Quản lý địa chỉ IP cho các thành phần

**Công cụ khuyên dùng:**
- **ZeroTier** (miễn phí, dễ cài)
- **Tailscale** (miễn phí, đơn giản)
- **Radmin** (tùy chọn khác)

**Lưu ý:** 
- Chụp ảnh màn hình từng bước cài đặt

---

#### **3.2 Tạo đường link kết nối mạng**
- Kết nối giữa các server với nhau
- Cấu hình static IP hoặc DHCP

---

#### **3.3 Cài đặt SQL Server hoặc MongoDB**

**Các bước:**
1. Tải và cài đặt hệ quản trị
2. Cấu hình dịch vụ
3. **Chụp ảnh màn hình** từng bước

---

#### **3.4 Kiểm tra dịch vụ Agent**
- SQL Server Agent (nếu dùng SQL Server)
- Đảm bảo dịch vụ đang chạy
- Kiểm tra log

---

#### **3.5 Tạo Link CSDL giữa các Server**

**SQL Server:**
- Cách tạo Linked Server
- Test kết nối

**MongoDB:**
- Cấu hình replica set (nếu dùng)

**Lưu ý:** 
- **Chụp ảnh màn hình** từng bước

---

#### **3.6 Tạo Publication (Publikasi)**

**Theo tài liệu hướng dẫn từ giáo viên**

**Các bước:**
1. Định nghĩa Article
2. Tạo Publication
3. Tạo Subscription
4. Kiểm tra đồng bộ hóa

**Lưu ý:** 
- **Chụp ảnh màn hình** từng bước

---

#### **3.7 Thử các giao tác (Transaction)**

**Viết SQL/Script cho các chức năng:**

**A. Nhập dữ liệu (Insert)**
- Chèn dữ liệu vào bảng
- Kích hoạt trigger nếu có

**B. Hiển thị dữ liệu (Select)**
- Lấy dữ liệu từ 1 vị trí
- **Kiểm tra:**
  - Có đồng bộ hóa không?
  - Có nhân bản không?
  - Có phân mảnh ngang không?
  - Linked Server hoạt động không?

**C. Thống kê (Statistics)**
- Tổng hợp dữ liệu
- **Kiểm tra tương tự như B**

**D. Cập nhật (Update)**
- Cập nhật dữ liệu
- Kiểm tra đồng bộ

**E. Xóa (Delete)**
- Xóa dữ liệu
- Kiểm tra cascade effects

---

**Viết Trigger để:**
- Phân quyền
- Bảo vệ dữ liệu
- Kiểm soát ràng buộc

---

### 🖥️ 4. Phân tích thiết kế & Viết phần mềm ứng dụng

#### **4.1 Phân tích lại thiết kế**
- Đánh giá tính hiệu quả
- Điều chỉnh nếu cần

#### **4.2 Viết phần mềm ứng dụng**
- Theo thiết kế đã xây dựng
- Cho từng trạm (workstation)
- Hỗ trợ các chức năng chính:
  - CRUD operations
  - Báo cáo thống kê
  - Xử lý giao tác
  - Quản lý quyền hạn

---

## 📊 BẢNG KIỂM TRA

### ✅ Checklist báo cáo

- [ ] Phần đặt vấn đề hoàn thiện
- [ ] Phân tích chi tiết các chức năng
- [ ] Ma trận phân quyền rõ ràng
- [ ] ER Diagram chính xác
- [ ] Thiết kế phân tán (fragments + localization)
- [ ] Sơ đồ kiến trúc hệ thống
- [ ] Tài liệu cài đặt với ảnh chụp
- [ ] Các script SQL/MongoDB
- [ ] Kết quả thử nghiệm (screenshots)
- [ ] Phần mềm ứng dụng hoạt động

---

## 📌 GHI CHÚ QUAN TRỌNG

### Những điểm cần lưu ý

1. **Chụp ảnh màn hình thường xuyên**
   - Mỗi bước cài đặt quan trọng
   - Mỗi kết quả kiểm tra

2. **Viết lệnh SQL/MongoDB cụ thể**
   - Không chỉ lý thuyết
   - Phải có kết quả thực thi

3. **Kiểm tra đồng bộ hóa**
   - Insert ở vị trí A
   - Verify dữ liệu xuất hiện ở B, C

4. **Báo cáo rõ ràng**
   - Phần lý thuyết: chi tiết, có ví dụ
   - Phần thực hành: có ảnh, có kết quả

5. **Quản lý quyền hạn**
   - Trigger bảo vệ dữ liệu
   - Kiểm tra phân quyền hiệu quả

---

## 🎓 YÊU CẦU ĐẦU RA

### Hoàn thành:
- ✅ Báo cáo lý thuyết (tùy nhóm)
- ✅ Tài liệu phân tích thiết kế
- ✅ Database schema (ER + Fragmentation)
- ✅ Script cài đặt & kiểm tra
- ✅ Phần mềm ứng dụng
- ✅ Tài liệu hướng dẫn sử dụng

---

**Cập nhật:** 2026-04-28  
**Nguồn:** Chuyển đổi từ DOCX → Markdown  
**Định dạng:** UTF-8, Vietnamese
