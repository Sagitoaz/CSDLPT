# Báo cáo thực thi Vai trò 5 (Security, Validation, Logging)

## 1) Thông tin báo cáo

- Người thực hiện: Thành viên 5 (Security + Validation + Logging)
- Dự án: Hệ thống quyên góp từ thiện phân tán (React + Express + MongoDB Replica Set)
- Mục tiêu: Chuẩn hóa đầu vào/đầu ra API, tăng khả năng truy vết request, chuẩn hóa mã lỗi, và bổ sung test đầy đủ theo checklist vai trò 5.

## 2) Bối cảnh trước khi triển khai

Trước khi thực hiện, backend đã có:

- Bảo mật cơ bản bằng `helmet`, `cors`, giới hạn `express.json({ limit: "1mb" })`.
- Validation dữ liệu đầu vào bằng `zod` tại nhiều route.

Tuy nhiên còn thiếu các điểm quan trọng:

- Chưa có request id để trace request từ đầu đến cuối.
- Chưa có log có cấu trúc (structured logging), chủ yếu là `console.log`/`console.error` rời rạc.
- Response lỗi giữa các module chưa đồng nhất định dạng.
- Chưa có mapping mã lỗi nghiệp vụ rõ ràng để test và tích hợp frontend ổn định.

## 3) Mục tiêu kỹ thuật đã chốt

Trong đợt triển khai này, các chuẩn sau đã được áp dụng:

1. Chuẩn error response thống nhất toàn backend.
2. Mỗi request có `x-request-id` để truy vết.
3. Log dạng JSON có cấu trúc cho luồng vào/ra/lỗi.
4. Chuẩn hóa mã lỗi HTTP + mã lỗi nghiệp vụ.
5. Test bao phủ các kịch bản bắt buộc: 400, 404, 500, route không tồn tại, và kiểm tra request id.

## 4) Danh sách thay đổi đã thực hiện

## 4.1) Hạ tầng HTTP chung

File cập nhật: `apps/backend/src/common/http.ts`

Đã bổ sung:

- Kiểu lỗi API chuẩn:
  - `ApiErrorBody` với cấu trúc:
    - `success: false`
    - `error: { code, message, details? }`
    - `requestId`
- `HttpError` để chuẩn hóa lỗi nghiệp vụ có `status`, `code`, `message`, `details`.
- `sendError(...)` để trả response lỗi thống nhất.
- `registerRequestTracing(...)`:
  - Tạo request id bằng `crypto.randomUUID()`.
  - Gắn `req.requestId` và header `x-request-id`.
  - Ghi log `http.in` khi request vào.
  - Ghi log `http.out` khi response kết thúc, có `durationMs`.
- `registerNotFoundHandler(...)`:
  - Trả chuẩn lỗi 404 cho route không tồn tại với mã `NOT_FOUND`.
- `registerErrorHandler(...)` nâng cấp:
  - Bắt `HttpError` theo chuẩn mã riêng.
  - Bắt lỗi `CastError` thành `INVALID_ID` (400).
  - Mọi lỗi còn lại trả `INTERNAL_ERROR` (500).
  - Ghi log `http.error` có cấu trúc đầy đủ.

## 4.2) Luồng app tổng

File cập nhật: `apps/backend/src/app/create-app.ts`

Đã tích hợp middleware theo đúng thứ tự:

1. `applySecurity(app)`
2. `registerRequestTracing(app)`
3. Đăng ký route API (`/api/donations`, `/api/campaigns`, `/api/stats`)
4. `registerNotFoundHandler(app)`
5. `registerErrorHandler(app)`

Ý nghĩa thực tế:

- Mọi request đều có request id ngay từ đầu.
- Route không khớp vẫn trả lỗi chuẩn có mã và request id.
- Mọi exception đều đi qua bộ xử lý lỗi thống nhất.

## 4.3) Chuẩn hóa route Donations

File cập nhật: `apps/backend/src/modules/donations/donation.routes.ts`

Đã đổi toàn bộ nhánh lỗi từ dạng cũ sang `sendError(...)` với mã lỗi rõ ràng:

- Lỗi validate query/body/params: `VALIDATION_ERROR` (400)
- Không tìm thấy donation: `DONATION_NOT_FOUND` (404)

Tác động thực tế:

- Frontend/test có thể dựa vào `error.code` thay vì parse message tự do.
- Tất cả lỗi donations có cùng format response.

## 4.4) Chuẩn hóa route Campaigns

File cập nhật: `apps/backend/src/modules/campaigns/campaign.routes.ts`

Áp dụng tương tự donations:

- `VALIDATION_ERROR` (400)
- `CAMPAIGN_NOT_FOUND` (404)

Tác động thực tế:

- Đồng nhất quy tắc xử lý lỗi giữa modules.
- Dễ viết test assertion và dễ tích hợp frontend.

## 4.5) Chuẩn hóa route Stats

File cập nhật: `apps/backend/src/modules/stats/stats.routes.ts`

Đã chuẩn hóa:

- Lỗi params code không hợp lệ: `VALIDATION_ERROR` (400)
- Campaign không tồn tại: `CAMPAIGN_NOT_FOUND` (404)

Tác động thực tế:

- Stats module không còn format lỗi riêng lẻ.

## 5) Luồng chạy thực tế sau triển khai

## 5.1) Luồng thành công (ví dụ GET hợp lệ)

Ví dụ: `GET /api/donations?page=1&limit=10`

1. Request vào middleware tracing.
2. Sinh `requestId`, gắn vào `req.requestId`, response header `x-request-id`.
3. Ghi log `http.in` chứa method/path/query/body.
4. Route parse query bằng Zod.
5. Service trả dữ liệu thành công.
6. Response trả JSON dữ liệu business (không ép bọc thành công để tránh phá vỡ tương thích hiện có).
7. Khi response kết thúc, ghi log `http.out` chứa status code và thời gian xử lý.

## 5.2) Luồng lỗi validation (400)

Ví dụ: `POST /api/donations` với payload thiếu trường bắt buộc.

1. Request đi qua tracing, có request id.
2. Zod `safeParse` thất bại.
3. Route gọi `sendError(...)` với:
   - `code: VALIDATION_ERROR`
   - `message` mô tả ngữ cảnh
   - `details` từ `zod.error.flatten()`
4. Client nhận response chuẩn:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid donation payload",
    "details": {
      "fieldErrors": {}
    }
  },
  "requestId": "..."
}
```

5. Kết thúc response sẽ có log `http.out` status 400.

## 5.3) Luồng lỗi không tìm thấy (404)

Ví dụ: `PATCH /api/donations/:id/status` với id không tồn tại.

1. Params hợp lệ.
2. Service trả `null`.
3. Route trả lỗi chuẩn mã `DONATION_NOT_FOUND` (hoặc `CAMPAIGN_NOT_FOUND` tùy module).
4. Client nhận được `requestId` để đối chiếu log backend.

## 5.4) Luồng route không tồn tại (404 global)

Ví dụ: `GET /api/does-not-exist`

1. Không khớp route nào.
2. `registerNotFoundHandler` trả:
   - `code: NOT_FOUND`
   - `message: Route not found`
3. Đảm bảo toàn hệ thống không có 404 “trần”, luôn theo cùng format.

## 5.5) Luồng lỗi hệ thống (500)

Ví dụ: service throw exception bất kỳ.

1. Exception được `asyncHandler` đẩy sang error middleware.
2. `registerErrorHandler` ghi log `http.error` với:
   - `requestId`, method, path, statusCode, errorCode
   - object lỗi đã serialize
3. Trả response chuẩn:
   - `code: INTERNAL_ERROR`
   - `message: Internal server error`
   - có `requestId`.

## 6) Chuẩn log đã triển khai

Các event log chính:

- `http.in`: khi request vào.
- `http.out`: khi response kết thúc.
- `http.error`: khi phát sinh lỗi xử lý.

Trường dữ liệu điển hình:

- `ts`, `level`, `event`
- `requestId`
- `method`, `path`
- `statusCode` (ở out/error)
- `durationMs` (ở out)
- `errorCode`, `error` (ở error)

Giá trị thực tế:

- Dễ lọc log theo `requestId` để debug một giao dịch cụ thể.
- Dễ tổng hợp số liệu theo status code và thời gian xử lý.
- Dễ viết script kiểm tra sau này (ELK, Loki, Datadog...).

## 7) Chuẩn mã lỗi áp dụng

Mã lỗi nghiệp vụ hiện dùng:

- `VALIDATION_ERROR` -> HTTP 400
- `INVALID_ID` -> HTTP 400
- `NOT_FOUND` -> HTTP 404 (route không tồn tại)
- `DONATION_NOT_FOUND` -> HTTP 404
- `CAMPAIGN_NOT_FOUND` -> HTTP 404
- `INTERNAL_ERROR` -> HTTP 500

Lợi ích:

- Frontend có thể switch theo `error.code` để hiển thị thông báo đúng.
- Test không phụ thuộc vào chuỗi message thay đổi theo ngôn ngữ.

## 8) Test đã bổ sung và kết quả

## 8.1) File test đã cập nhật/thêm mới

- Cập nhật: `apps/backend/src/modules/donations/donation.routes.test.ts`
- Cập nhật: `apps/backend/src/modules/campaigns/campaign.routes.test.ts`
- Thêm mới: `apps/backend/src/app/create-app.test.ts`

## 8.2) Case đã cover

- Donations:
  - Query hợp lệ trả dữ liệu đúng.
  - Payload sai trả 400 + `VALIDATION_ERROR` + có `requestId`.
  - Không tìm thấy trả 404 + `DONATION_NOT_FOUND`.
  - Có header `x-request-id`.
- Campaigns:
  - Query parse đúng.
  - Date range sai trả 400 + `VALIDATION_ERROR` + có `requestId`.
- App-level:
  - `/health` có `x-request-id`.
  - Route không tồn tại trả `NOT_FOUND`.
  - Lỗi nội bộ trả `INTERNAL_ERROR`.

## 8.3) Kết quả chạy test

Lệnh chạy:

```bash
npm --prefix apps/backend test
```

Kết quả cuối cùng:

- Tổng: 13 tests
- Pass: 13
- Fail: 0

## 9) Giá trị thực tế sau khi hoàn thành

Sau triển khai, backend đạt các điểm quan trọng cho demo và vận hành:

1. Dễ test tự động hơn:
- Có format lỗi ổn định để assertion.
- Có mã lỗi chuẩn hóa, giảm test “mỏng manh”.

2. Dễ debug hơn:
- Mỗi request có id riêng.
- Có log vào/ra/lỗi đầy đủ trường kỹ thuật.

3. Dễ tích hợp frontend hơn:
- Frontend có thể dựa theo `error.code` thay vì đoán thông điệp tự do.

4. An toàn hơn ở tầng API:
- Validation được trả về nhất quán, dễ kiểm soát behavior.
- Route 404 và lỗi 500 không còn phản hồi rời rạc.

## 10) Các điểm cần làm tiếp (khuyến nghị)

1. Chuẩn hóa response thành công (`success: true`, `data`, `meta`) nếu team muốn “in/out” đối xứng hoàn toàn.
2. Thêm masking dữ liệu nhạy cảm trong log body/query (ví dụ email, token).
3. Bổ sung rate limit cho endpoint public.
4. Thêm test body quá lớn (`PayloadTooLargeError`) để cover sâu hơn phần `body size limit`.
5. Đồng bộ schema validation frontend với backend qua package shared (nếu thống nhất kiến trúc dùng chung schema).

## 11) Kết luận

Hạng mục của vai trò 5 đã hoàn thành đúng trọng tâm:

- Có tracing và logging có cấu trúc.
- Có chuẩn lỗi API nhất quán, có mã lỗi và request id.
- Có test bao phủ đầy đủ các kịch bản bắt buộc.
- Toàn bộ test backend đã pass.

Điều này giúp hệ thống ổn định hơn khi demo, dễ truy vết khi lỗi, và sẵn sàng cho bước mở rộng tiếp theo.