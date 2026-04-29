# Vai trò 5 - Security, Validation, Logging

Tài liệu này dành cho thành viên số 5 trong nhóm 6 người. Mục tiêu của bạn không phải làm thêm business logic, mà là chuẩn hóa đầu vào, tăng độ an toàn và làm rõ cách hệ thống ghi log.

## 1. Tổng quan dự án hiện tại

Dự án là hệ thống quyên góp từ thiện phân tán, gồm 3 phần chính:

- Frontend: React + Vite
- Backend: Node.js + Express + TypeScript
- Database: MongoDB Replica Set 3 node

Luồng chính hiện tại:

1. Frontend gọi API sang backend tại `http://localhost:8080/api`.
2. Backend nhận request, validate dữ liệu bằng `zod`.
3. Backend thao tác với MongoDB thông qua Mongoose.
4. API trả về danh sách, tạo mới, cập nhật trạng thái, và thống kê.

## 2. Cấu trúc hiện có

### Backend

- Khởi động ở `apps/backend/src/server.ts`.
- Tạo Express app ở `apps/backend/src/app/create-app.ts`.
- Security middleware ở `apps/backend/src/infrastructure/http/security.ts`.
- Xử lý lỗi chung ở `apps/backend/src/common/http.ts`.
- Module donation ở `apps/backend/src/modules/donations/`.
- Module campaign ở `apps/backend/src/modules/campaigns/`.
- Module stats ở `apps/backend/src/modules/stats/`.

### Frontend

- Giao diện chính ở `apps/frontend/src/App.tsx`.
- Style ở `apps/frontend/src/styles.css`.
- Hiện tại frontend có form tạo donation, danh sách donation, và nút duyệt/từ chối.

### Shared

- `packages/shared/src/index.ts` đang mới có type `DonationStatus` và `DonationDto`.

## 3. Trạng thái hiện tại của security, validation, logging

### Đã có sẵn

- `helmet` đã được bật trong backend.
- `cors` đã được cấu hình theo `CORS_ORIGIN`.
- `express.json({ limit: "1mb" })` đã chặn body quá lớn.
- Backend đã dùng `zod` để validate input cho donations và campaigns.
- Rule date range của campaign đã có.
- List query cho donation và campaign đã có validate, phân trang và sort.

### Còn thiếu hoặc cần chuẩn hóa

- Logging còn rất cơ bản, chủ yếu là `console.error` và `console.log`.
- Chưa có request id để trace một request từ đầu đến cuối.
- Chưa có logger có cấu trúc cho request/response/error.
- Frontend chưa có validate đồng bộ với backend schema.
- Chưa có quy ước thống nhất cho cách trả lỗi validate và lỗi hệ thống.

## 4. Việc bạn cần làm

### Mục tiêu chính

Bạn phải làm cho hệ thống:

- an toàn hơn với input xấu hoặc sai định dạng,
- dễ debug hơn khi có lỗi,
- dễ test hơn khi chạy demo,
- và có behavior đồng nhất giữa frontend và backend.

### Việc cần ưu tiên

1. Chuẩn hóa validation đầu vào
2. Bổ sung logging có cấu trúc
3. Thêm request id cho mỗi request
4. Kiểm tra lại security headers, CORS, body size limit
5. Viết thêm test cho validation và security behavior

## 5. Checklist công việc cụ thể

### A. Validation

- Kiểm tra lại tất cả route backend có validate đầy đủ không.
- Đảm bảo mỗi request body, params và query đều đi qua schema rõ ràng.
- Đồng bộ các quy tắc validate giữa donations, campaigns, stats.
- Nếu cần, tách schema chung sang `packages/shared` để frontend và backend dùng chung.
- Kiểm tra message lỗi validate có dễ hiểu không.

### B. Frontend validation

- Thêm validate cơ bản cho form donation trên frontend.
- Chặn các giá trị rỗng hoặc không hợp lệ trước khi gửi API.
- Hiển thị lỗi rõ ràng khi submit thất bại.
- Nếu được, dùng cùng logic schema với backend thay vì viết hai bộ quy tắc riêng.

### C. Logging

- Tạo request id middleware.
- Gắn request id vào mỗi log.
- Ghi log cho request vào/ra quan trọng.
- Log đầy đủ khi có lỗi backend.
- Cân nhắc giữa `console.log` thủ công và logger có cấu trúc, ưu tiên logger có cấu trúc nếu có thể.

### D. Security

- Kiểm tra lại `helmet` đang bật những gì.
- Xem lại CORS origin có chỉ cho phép đúng frontend mong muốn không.
- Kiểm tra body size limit có hợp lý với form hiện tại không.
- Đảm bảo không mở rộng method/headers không cần thiết.
- Nếu có auth về sau, chuẩn bị cho việc tách public API và admin API.

### E. Test

- Thêm test cho trường hợp validate lỗi ở route.
- Thêm test cho trường hợp body quá lớn hoặc sai schema.
- Thêm test cho route thất bại 404/400/500 nếu cần.
- Nếu bổ sung request id hoặc logger, thêm test để đảm bảo middleware chạy đúng thứ tự.

## 6. File cần đọc trước khi bắt đầu

- [README.md](../README.md)
- [apps/backend/src/app/create-app.ts](../apps/backend/src/app/create-app.ts)
- [apps/backend/src/infrastructure/http/security.ts](../apps/backend/src/infrastructure/http/security.ts)
- [apps/backend/src/common/http.ts](../apps/backend/src/common/http.ts)
- [apps/backend/src/modules/donations/donation.schemas.ts](../apps/backend/src/modules/donations/donation.schemas.ts)
- [apps/backend/src/modules/donations/donation.routes.ts](../apps/backend/src/modules/donations/donation.routes.ts)
- [apps/backend/src/modules/campaigns/campaign.schemas.ts](../apps/backend/src/modules/campaigns/campaign.schemas.ts)
- [apps/backend/src/modules/campaigns/campaign.routes.ts](../apps/backend/src/modules/campaigns/campaign.routes.ts)
- [apps/frontend/src/App.tsx](../apps/frontend/src/App.tsx)

## 7. Hiểu đúng vai trò của bạn trong nhóm

Nếu đặt trong nhóm 6 người, vai trò của bạn là lớp bảo vệ cho toàn hệ thống.

Bạn không cần sửa logic nghiệp vụ chính của quyên góp hay campaign, nhưng bạn phải đảm bảo:

- dữ liệu gửi lên đúng định dạng,
- lỗi được trả về rõ ràng,
- request có thể trace được,
- API không bị mở quá mức cần thiết,
- và frontend không gửi request sai một cách dễ dàng.

## 8. Thứ tự làm việc để dễ kiểm soát

1. Đọc README và các file backend chính.
2. Xác định các input nào cần validate thêm.
3. Chọn cách làm request id và structured logging.
4. Cập nhật frontend nếu có form nào cần validate.
5. Bổ sung test cho các case quan trọng.
6. Kiểm tra lại tất cả route có behavior đồng nhất.

## 8.1. Quy trình bắt buộc: hoàn thành bước chuẩn bị rồi mới code

Mục này dùng để đảm bảo bạn không code vội. Chỉ bắt đầu sửa code khi hoàn tất toàn bộ checklist chuẩn bị bên dưới.

### Giai đoạn A - Chuẩn bị (chưa code)

1. Chốt phạm vi
- Liệt kê rõ endpoint nào sẽ tác động: donations, campaigns, stats, health.
- Ghi rõ mục tiêu cho từng endpoint: validation, logging, mã lỗi, hay cả ba.

2. Chốt chuẩn response
- Chốt format response thành công (in): giữ nguyên hay bọc thêm metadata.
- Chốt format response lỗi (out): thống nhất `code`, `message`, `requestId`, `details`.
- Chốt mapping mã lỗi HTTP và mã lỗi nghiệp vụ.

3. Chốt chuẩn logging
- Chốt các event log tối thiểu: request vào, request ra, lỗi.
- Chốt field log bắt buộc: timestamp, level, requestId, method, path, statusCode, duration.
- Chốt quy tắc che dữ liệu nhạy cảm (email, token, mật khẩu nếu có).

4. Chốt test plan
- Liệt kê test case bắt buộc cho validation lỗi 400.
- Liệt kê test case cho route không tồn tại 404.
- Liệt kê test case cho lỗi hệ thống 500.
- Liệt kê test kiểm tra header `x-request-id`.

5. Review chéo
- Gửi checklist trên cho Tech Lead hoặc 1 thành viên backend review nhanh.
- Chỉ chuyển sang code khi nhận xác nhận “scope và format ổn”.

### Giai đoạn B - Triển khai (được phép code)

1. Tạo middleware request id + logging in/out.
2. Chuẩn hóa error handler và mã lỗi.
3. Chuẩn hóa các route để trả lỗi theo một format.
4. Cập nhật test cho format mới.
5. Chạy test, sửa lỗi, chốt PR.

### Giai đoạn C - Nghiệm thu

1. Tự test thủ công 3 case: thành công, validate lỗi, lỗi hệ thống.
2. Xác nhận log có đủ requestId và có thể trace theo một request.
3. Xác nhận response lỗi đồng nhất giữa các module.
4. Cập nhật tài liệu ngắn trong PR: bạn đã chuẩn hóa gì.

## 9. Định nghĩa hoàn thành

Công việc của bạn xem là xong khi:

- các route chính đều validate rõ ràng,
- lỗi validate trả về đồng nhất,
- có logging đủ để debug,
- có request id nếu cần trace,
- frontend không gửi dữ liệu sai cơ bản,
- và test cover các case quan trọng.
