# 📖 Danh Sách Hướng Dẫn Dự Án (Guide Index)

**Cập nhật:** 2026-04-28

---

## 📚 Các File Hướng Dẫn

### Lý Thuyết & Tổng Quan

| # | File | Nội dung | Kích thước |
|---|------|---------|-----------|
| 01 | [01-tong-quan-du-an.md](01-tong-quan-du-an.md) | Tổng quan dự án | ~2 KB |
| 02 | [02-cai-dat-moi-truong.md](02-cai-dat-moi-truong.md) | Cài đặt môi trường | ~3 KB |
| 03 | [03-thiet-lap-tailscale.md](03-thiet-lap-tailscale.md) | Cài Tailscale VPN | ~2 KB |
| 04 | [04-thiet-lap-mongodb-phan-tan.md](04-thiet-lap-mongodb-phan-tan.md) | MongoDB Replica Set | ~5 KB |
| 05 | [05-chay-web-va-kiem-thu.md](05-chay-web-va-kiem-thu.md) | Chạy & test web | ~2 KB |
| 06 | [06-phan-cong-6-thanh-vien.md](06-phan-cong-6-thanh-vien.md) | Phân công nhóm | ~1 KB |
| 07 | [07-khung-bao-cao-theo-de.md](07-khung-bao-cao-theo-de.md) | Khung báo cáo | ~3 KB |

---

### Phân Tích Yêu Cầu & Đặc Tả

| # | File | Nội dung | Kích thước | Ghi chú |
|---|------|---------|-----------|---------|
| 09 | [09-doi-chieu-yeu-cau-docx-va-thuc-trang-du-an.md](09-doi-chieu-yeu-cau-docx-va-thuc-trang-du-an.md) | So sánh DOCX vs dự án | ~5 KB | Gap analysis |
| **11** | **[11-yeu-cau-bai-tap-lon-csdlpt-chi-tiet.md](11-yeu-cau-bai-tap-lon-csdlpt-chi-tiet.md)** | **Yêu cầu DOCX (Markdown)** | **~8 KB** | **✨ MỚI - Chuyển từ DOCX** |

---

### Tài Liệu Kỹ Thuật & Thiết Kế

| File | Nội dung | Vị trí |
|------|---------|--------|
| REFACTORING_SUMMARY.md | Tóm tắt cải tổ dự án | `aidlc-docs/construction/` |
| COMPLETION_REPORT.md | Báo cáo hoàn thành | Thư mục gốc |
| QUICK_START_REMAINING.md | Hướng dẫn bước tiếp | Thư mục gốc |
| entity-relationship-diagram.md | ERD và thiết kế DB | `aidlc-docs/construction/functional-design/` |
| sharding-strategy.md | Chiến lược phân mảnh | `aidlc-docs/construction/infrastructure-design/` |
| data-access-matrix.md | Ma trận phân quyền | `aidlc-docs/inception/requirements/` |
| security-compliance-audit.md | Kiểm toán bảo mật | `aidlc-docs/construction/build-and-test/` |

---

## 🎯 Cách Sử Dụng

### Lần đầu tiên?
1. Đọc [01-tong-quan-du-an.md](01-tong-quan-du-an.md)
2. Đọc [02-cai-dat-moi-truong.md](02-cai-dat-moi-truong.md)
3. Đọc [03-thiet-lap-tailscale.md](03-thiet-lap-tailscale.md)

### Cần hiểu yêu cầu dự án?
👉 **[11-yeu-cau-bai-tap-lon-csdlpt-chi-tiet.md](11-yeu-cau-bai-tap-lon-csdlpt-chi-tiet.md)** ← START HERE
- Đây là **chuyển đổi Markdown** từ file DOCX gốc
- **Dễ đọc, dễ tìm kiếm, không cần mở DOCX**
- Bao gồm tất cả yêu cầu chi tiết

### Cần setup MongoDB?
👉 [04-thiet-lap-mongodb-phan-tan.md](04-thiet-lap-mongodb-phan-tan.md)

### Cần biết kiến trúc hệ thống?
👉 Đọc [REFACTORING_SUMMARY.md](../REFACTORING_SUMMARY.md) 
👉 Xem [entity-relationship-diagram.md](../aidlc-docs/construction/functional-design/entity-relationship-diagram.md)

---

## 🆕 File Mới Được Thêm

**File 11: `11-yeu-cau-bai-tap-lon-csdlpt-chi-tiet.md`**

### Nội dung
✅ Lý thuyết - Phân công 7 nhóm  
✅ Bài tập thực hành - Hướng dẫn chi tiết từng bước  
✅ Cài đặt VPN, CSDL, Replication  
✅ Tạo giao tác, kiểm tra đồng bộ  
✅ Viết phần mềm ứng dụng  

### Lợi ích
✨ **Không cần mở file DOCX nữa**  
✨ **Dễ tìm kiếm, dễ đọc trên markdown**  
✨ **Tiết kiệm token khi truy cập**  
✨ **Có thể reference trực tiếp trong code**  

### Cách truy cập
```bash
# Terminal
cat huong-dan/11-yeu-cau-bai-tap-lon-csdlpt-chi-tiet.md

# Hoặc VS Code
Ctrl+P → 11-yeu-cau-bai-tap-lon-csdlpt-chi-tiet.md
```

---

## 📁 Cấu Trúc Thư Mục

```
huong-dan/
├── 01-tong-quan-du-an.md                      # Tổng quan
├── 02-cai-dat-moi-truong.md                   # Cài đặt
├── 03-thiet-lap-tailscale.md                  # VPN setup
├── 04-thiet-lap-mongodb-phan-tan.md           # MongoDB
├── 05-chay-web-va-kiem-thu.md                 # Chạy web
├── 06-phan-cong-6-thanh-vien.md               # Phân công
├── 07-khung-bao-cao-theo-de.md                # Khung báo cáo
├── 09-doi-chieu-yeu-cau-docx-va-thuc-trang-du-an.md  # So sánh
└── 11-yeu-cau-bai-tap-lon-csdlpt-chi-tiet.md ✨ MỚI

aidlc-docs/
├── construction/
│   ├── functional-design/
│   │   └── entity-relationship-diagram.md     # ERD
│   ├── infrastructure-design/
│   │   └── sharding-strategy.md               # Sharding
│   ├── build-and-test/
│   │   ├── security-compliance-audit.md       # Security
│   │   └── REFACTORING_SUMMARY.md             # Tóm tắt
│   └── plans/
│       └── enhancement-and-refactor-plan.md   # Kế hoạch
└── inception/
    └── requirements/
        ├── data-access-matrix.md              # Phân quyền
        └── requirements.md                    # Yêu cầu

README.md
COMPLETION_REPORT.md                           # Báo cáo hoàn thành
QUICK_START_REMAINING.md                       # Bước tiếp theo
```

---

## 🔍 Tìm Kiếm Nhanh

### Muốn biết...

**...đặt vấn đề dự án?**
→ File 11, Mục 2.1

**...phân tích yêu cầu?**
→ File 11, Mục 2.2.1

**...thiết kế CSDL?**
→ File 11, Mục 2.2.2 + entity-relationship-diagram.md

**...cài đặt VPN?**
→ File 03 hoặc File 11, Mục 3.1

**...cài MongoDB?**
→ File 04 hoặc File 11, Mục 3.3

**...tạo giao tác?**
→ File 11, Mục 3.7

**...viết app?**
→ File 11, Mục 4

**...phân quyền?**
→ data-access-matrix.md hoặc File 11, Mục 2.2.1B

**...bảo mật?**
→ security-compliance-audit.md

---

## 📊 Thống Kê

| Loại | Số lượng | Tổng kích thước |
|------|---------|-----------------|
| Hướng dẫn (.md) | 9 | ~25 KB |
| Tài liệu thiết kế | 6 | ~30 KB |
| Scripts & Code | 10+ | ~50 KB |
| **Tổng** | **25+** | **~100 KB** |

---

## ⚡ Mẹo Sử Dụng

### 1. Mở file Markdown nhanh
```bash
# Dùng VS Code
code huong-dan/11-yeu-cau-bai-tap-lon-csdlpt-chi-tiet.md
```

### 2. Tìm kiếm trong file
```
Ctrl+F → Nhập từ khóa (VD: "MongoDB", "giao tác", "phân quyền")
```

### 3. Copy lệnh SQL/Script
```
Các lệnh có sẵn trong file, chỉ cần copy-paste
```

### 4. Tham chiếu trong code
```
// Tham chiếu tài liệu
// Xem huong-dan/11-yeu-cau-bai-tap-lon-csdlpt-chi-tiet.md#mục-3
```

---

## ✅ Checklist Cập nhật

- [x] Chuyển DOCX → Markdown
- [x] Format đẹp, dễ đọc
- [x] Thêm table of contents
- [x] Thêm link tham chiếu
- [x] Dọn dẹp file tạm thời
- [x] Tạo guide index

---

## 📞 Hỗ Trợ

### Nếu cần...

- **Mở file DOCX gốc lại?** → `BÀI TẬP LỚN CỦA MỖI NHÓM_2026_hệ chuẩn_l.docx`
- **Tìm file nào?** → Xem mục "Tìm Kiếm Nhanh"
- **Hiểu yêu cầu?** → Bắt đầu từ File 11

---

**Tạo:** 2026-04-28  
**Phiên bản:** 1.0  
**Format:** Markdown + UTF-8  
**Status:** ✅ Ready to use
