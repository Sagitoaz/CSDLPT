# 10 - Hướng dẫn tự test end-to-end cho Vai trò 5

Tài liệu này ưu tiên luồng test dễ chạy nhất trên máy cá nhân, sau đó mới đến luồng replica set đầy đủ. Mục tiêu là để bạn kiểm tra được chính xác phần đã làm của vai trò 5:

- Logging có cấu trúc
- Request ID (`x-request-id`)
- Chuẩn hóa lỗi API (`error.code`, `message`, `requestId`)
- Test 400/404/500 đầy đủ

## 1) Điều kiện cần

- Windows + PowerShell
- Đã cài Node.js (khuyến nghị >= 20)
- Đã cài Docker Desktop
- Docker Desktop đang chạy

## 2) Chuẩn bị môi trường

### 2.1. Luồng khuyến nghị để test nhanh

Hiện tại file `.env` của dự án đang dùng cấu hình dễ chạy:

```dotenv
PORT=8080
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/charity_distributed?directConnection=true
```

Luồng này là luồng nên dùng để test vai trò 5 hằng ngày vì:

- Không cần sửa file hosts
- Không cần `rs.initiate`
- Không cần failover để kiểm tra validation/logging/request id
- Chạy nhanh và ít lỗi môi trường nhất

### 2.2. Luồng replica set đầy đủ

Nếu bạn muốn demo phân tán/failover, mới dùng luồng replica set ở mục 10.

## 3) Khởi động MongoDB local bằng Docker

Từ thư mục gốc dự án, chạy:

```powershell
docker compose -f infrastructure/mongodb/docker-compose.replicaset.yml up -d
```

Kiểm tra container đã lên:

```powershell
docker ps --filter "name=mongo"
```

Kỳ vọng có 3 container:

- mongo1
- mongo2
- mongo3

## 4) Cài dependencies

```powershell
npm install
npm run setup
```

Nếu trước đó đã cài rồi, có thể bỏ qua.

## 5) Chạy backend + frontend

```powershell
npm run dev
```

Kỳ vọng:

- Backend: `http://localhost:8080`
- Frontend: `http://localhost:5173`

Nếu chỉ muốn kiểm tra backend, bạn có thể chạy riêng:

```powershell
npm --prefix apps/backend run dev
```

## 6) Chạy test tự động backend

Mở terminal mới và chạy:

```powershell
npm --prefix apps/backend test
```

Kỳ vọng:

- Toàn bộ test pass, bao gồm test route, test request id, test lỗi 400/404/500.

## 7) Test thủ công các tính năng vai trò 5

Dùng PowerShell để gọi API trực tiếp.

### 7.1. Health + request id

```powershell
curl.exe -i "http://localhost:8080/health"
```

Kỳ vọng:

- Status code: `200`
- Có header `x-request-id`
- Body có `ok: true`

Bạn sẽ thấy dòng `HTTP/1.1 200 OK` ngay trong terminal.

### 7.2. Validation error 400

Đây là cách an toàn nhất trên PowerShell, tránh lỗi quote JSON:

```powershell
Set-Content -Path .tmp-invalid-donation.json -Value '{"donorName":"A"}'
curl.exe -i -X POST "http://localhost:8080/api/donations" -H "Content-Type: application/json" --data-binary "@.tmp-invalid-donation.json"
Remove-Item .tmp-invalid-donation.json -ErrorAction SilentlyContinue
```

Kỳ vọng response lỗi có dạng:

- `success: false`
- `error.code: "VALIDATION_ERROR"`
- Có `requestId`

### 7.3. Route không tồn tại 404

```powershell
curl.exe -i "http://localhost:8080/api/khong-ton-tai"
```

Kỳ vọng:

- Status `404`
- `error.code: "NOT_FOUND"`
- Có `requestId`

### 7.4. Not found theo nghiệp vụ 404

```powershell
Set-Content -Path .tmp-status.json -Value '{"status":"verified"}'
curl.exe -i -X PATCH "http://localhost:8080/api/donations/000000000000000000000001/status" -H "Content-Type: application/json" --data-binary "@.tmp-status.json"
Remove-Item .tmp-status.json -ErrorAction SilentlyContinue
```

Kỳ vọng:

- Status `404`
- `error.code: "DONATION_NOT_FOUND"`
- Có `requestId`

## 8) Cách kiểm tra log backend cho đúng chuẩn

Khi bạn gọi các API ở bước 7, terminal backend phải in log JSON:

- `event: "http.in"`
- `event: "http.out"`
- `event: "http.error"` (khi có lỗi)

Các field quan trọng cần có:

- `ts`
- `level`
- `requestId`
- `method`
- `path`
- `statusCode` (out/error)
- `durationMs` (out)

Mẹo test truy vết:

1. Copy `requestId` từ response.
2. Tìm `requestId` đó trong log backend.
3. Đảm bảo thấy được cả vòng đời request (in -> out/error).

## 9) Cách đọc kết quả đúng

Khi chạy xong các lệnh ở bước 7, bạn chỉ cần nhìn trực tiếp ở terminal:

- `HTTP/1.1 200 OK` nghĩa là health đã chạy đúng.
- `HTTP/1.1 400 Bad Request` và `error.code = VALIDATION_ERROR` nghĩa là validate đang hoạt động.
- `HTTP/1.1 404 Not Found` và `NOT_FOUND` nghĩa là route global 404 đang hoạt động.
- `HTTP/1.1 404 Not Found` và `DONATION_NOT_FOUND` nghĩa là not found theo nghiệp vụ đang hoạt động.

## 10) Test failover nhanh (tùy chọn, chỉ khi cần demo CSDL phân tán)

Phần này chỉ dùng khi bạn muốn demo replica set/failover. Không cần cho test vai trò 5 hằng ngày.

Xem node nào là primary:

```powershell
docker exec -it mongo1 mongosh --port 27017 --eval "rs.status().members.map(m => ({name:m.name,state:m.stateStr}))"
```

Nếu muốn khởi tạo replica set đầy đủ, dùng lệnh:

```powershell
docker exec -it mongo1 mongosh --port 27017 --eval "rs.initiate({_id:'rsCharity',members:[{_id:0,host:'mongo1:27017'},{_id:1,host:'mongo2:27018'},{_id:2,host:'mongo3:27019'}]})"
```

Khi test failover, hãy nhớ:

- Dùng replica set URI trong `.env`
- Môi trường này cần hostname resolve đúng
- Chỉ dùng khi bạn thật sự cần demo failover

## 11) Dọn môi trường sau khi test

Dừng app dev (`Ctrl + C`), sau đó tắt MongoDB containers:

```powershell
docker compose -f infrastructure/mongodb/docker-compose.replicaset.yml down
```

Nếu muốn xóa luôn dữ liệu volume:

```powershell
docker compose -f infrastructure/mongodb/docker-compose.replicaset.yml down -v
```

## 12) Lỗi thường gặp và cách xử lý nhanh

1. Lỗi `MONGODB_URI is required`
- Chưa có `.env` hoặc thiếu biến `MONGODB_URI`.

2. Backend không kết nối được MongoDB
- Kiểm tra Docker Desktop đang chạy.
- Kiểm tra 3 container mongo đã up.
- Với quick mode, `MONGODB_URI` nên là `mongodb://localhost:27017/charity_distributed?directConnection=true`.

3. Test fail do chưa cài package
- Chạy lại `npm run setup` hoặc `npm --prefix apps/backend install`.

4. Có container nhưng app vẫn lỗi timeout
- Kiểm tra backend đã chạy chưa.
- Kiểm tra bạn đang dùng quick mode hay replica set mode.

5. Lỗi `replSetInitiate quorum check failed`
- Nguyên nhân thường do dùng `localhost` cho các node khác khi chạy lệnh trong container.
- Sửa bằng lệnh `rs.initiate` dùng `mongo1:27017`, `mongo2:27018`, `mongo3:27019`.

## 13) Tiêu chí pass cuối cùng

Bạn xem là test đạt khi:

1. `curl.exe -i "http://localhost:8080/health"` trả `200 OK`.
2. API lỗi đều trả format thống nhất có `requestId`.
3. Response có header `x-request-id`.
4. Log backend có đủ `http.in`, `http.out`, `http.error` và có thể trace theo request id.
5. `npm --prefix apps/backend test` pass toàn bộ.

## 14) Ghi nhớ nhanh

Nếu mục tiêu của bạn chỉ là test vai trò 5, hãy dùng quick mode.

Nếu mục tiêu của bạn là demo phân tán/failover, hãy dùng replica set mode ở mục 10.

