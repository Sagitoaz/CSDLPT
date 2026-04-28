# Hướng dẫn chi tiết tích hợp BE vào FE và triển khai 6 máy (PowerShell thuần, không Docker)

Tài liệu này dùng cho đúng bối cảnh nhóm bạn: **không dùng Docker**, chỉ chạy bằng Windows + PowerShell + Node.js + MongoDB Community Server.

## 0) Trả lời nhanh câu hỏi của bạn

Có, **chạy được dự án hoàn toàn không cần Docker**.

Mô hình đúng cho bài này:

- 1 Replica Set duy nhất: `rsCharity`
- 3 máy DB, mỗi máy chạy **1 MongoDB node** trên cổng `27017`
- Không làm kiểu mỗi máy tự tạo 1 Replica Set riêng
- Không cần mỗi máy tạo thêm 2 secondary (vừa nặng, vừa không cần thiết)

## 1) Mô hình 6 máy đề xuất

- Máy 1: MongoDB Node A
- Máy 2: MongoDB Node B
- Máy 3: MongoDB Node C
- Máy 4: Backend (Node.js/Express)
- Máy 5: Frontend (`fe/`)
- Máy 6: QA + kiểm thử failover + backup/restore

Tất cả máy cùng vào một mạng Tailscale.

## 2) Chuẩn bị chung cho cả 6 máy

### 2.1 Cài phần mềm bắt buộc

- Tailscale
- Node.js 20+
- MongoDB Community Server (chỉ bắt buộc cho máy 1,2,3 và máy 6 nếu muốn dùng `mongosh` kiểm tra)

### 2.2 Kiểm tra Tailscale

Chạy trên từng máy:

```powershell
tailscale status
tailscale ip -4
```

Lưu lại IP của từng máy:

- `DB1_IP`
- `DB2_IP`
- `DB3_IP`
- `BACKEND_IP`
- `FE_IP`

## 3) Phân công chi tiết theo từng người (kèm lệnh)

## Người 1 - Trưởng nhóm (điều phối)

Nhiệm vụ:

- Thu thập đủ 5 IP ở trên
- Tạo bảng mapping máy - vai trò
- Gửi thông số cấu hình cho Người 4,5,6

Lệnh:

```powershell
tailscale status
tailscale ip -4
```

Bảng cần gửi cho cả nhóm:

- DB1_IP = ...
- DB2_IP = ...
- DB3_IP = ...
- BACKEND_IP = ...
- FE_IP = ...

## Người 2 - Máy 1 (MongoDB Node A)

### Bước 1: Tạo thư mục dữ liệu và log

```powershell
New-Item -ItemType Directory -Force C:\mongodb\data\rs1 | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\log | Out-Null
```

### Bước 2: Tạo file cấu hình `C:\mongodb\mongod-rs1.yml`

Nội dung:

```yaml
storage:
  dbPath: C:\mongodb\data\rs1
systemLog:
  destination: file
  path: C:\mongodb\log\mongod-rs1.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27017
replication:
  replSetName: rsCharity
```

### Bước 3: Mở firewall cổng 27017

```powershell
New-NetFirewallRule -DisplayName "MongoDB-27017" -Direction Inbound -Protocol TCP -LocalPort 27017 -Action Allow
```

### Bước 4: Chạy MongoDB node

```powershell
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\mongod-rs1.yml
```

Giữ cửa sổ này chạy trong lúc demo.

## Người 3 - Máy 2 (MongoDB Node B)

Làm tương tự Người 2, chỉ đổi tên thư mục/log cho dễ theo dõi.

### Bước 1

```powershell
New-Item -ItemType Directory -Force C:\mongodb\data\rs2 | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\log | Out-Null
```

### Bước 2: file `C:\mongodb\mongod-rs2.yml`

```yaml
storage:
  dbPath: C:\mongodb\data\rs2
systemLog:
  destination: file
  path: C:\mongodb\log\mongod-rs2.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27017
replication:
  replSetName: rsCharity
```

### Bước 3

```powershell
New-NetFirewallRule -DisplayName "MongoDB-27017" -Direction Inbound -Protocol TCP -LocalPort 27017 -Action Allow
```

### Bước 4

```powershell
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\mongod-rs2.yml
```

## Người 4 - Máy 3 (MongoDB Node C + khởi tạo Replica Set)

### Bước 1,2,3,4

Làm tương tự Người 2 và 3 với file `mongod-rs3.yml`.

### Bước 5: Khởi tạo Replica Set

Mở PowerShell khác và chạy:

```powershell
& "C:\Program Files\MongoDB\Server\7.0\bin\mongosh.exe" "mongodb://DB1_IP:27017"
```

Trong `mongosh`, chạy:

```javascript
rs.initiate({
  _id: "rsCharity",
  members: [
    { _id: 0, host: "DB1_IP:27017" },
    { _id: 1, host: "DB2_IP:27017" },
    { _id: 2, host: "DB3_IP:27017" }
  ]
})
```

Kiểm tra:

```javascript
rs.status()
```

Điều kiện đúng:

- 1 node PRIMARY
- 2 node SECONDARY

## Người 5 - Máy 4 (Backend)

### Bước 1: tạo file `.env` ở thư mục gốc project

```env
PORT=8080
NODE_ENV=development
MONGODB_URI=mongodb://DB1_IP:27017,DB2_IP:27017,DB3_IP:27017/charity_distributed?replicaSet=rsCharity
CORS_ORIGIN=http://localhost:5174,http://FE_IP:5174
```

### Bước 2: cài dependency và chạy backend

```powershell
npm install
npm --prefix apps/backend install
npm --prefix apps/backend run dev
```

### Bước 3: test backend

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/health"
Invoke-RestMethod -Uri "http://localhost:8080/api/stats/overview"
```

Nếu máy FE truy cập qua Tailscale thì gửi URL cho Người 6:

- `http://BACKEND_IP:8080`

### Bước 4: seed dữ liệu (nếu cần)

```powershell
npm --prefix apps/backend run seed
```

## Người 6 - Máy 5 (Frontend) + Máy 6 (QA)

## 3.6.1 Trên máy FE: cấu hình chạy dữ liệu thật

Tạo `fe/.env`:

```env
VITE_API_BASE=http://BACKEND_IP:8080/api
VITE_USE_MOCK=false
```

Chạy FE:

```powershell
npm --prefix fe install
npm --prefix fe run dev
```

Mở:

- `http://localhost:5174`

Kiểm tra trên UI:

- Banner phải hiển thị **Nguồn dữ liệu: BACKEND**
- Nếu hiển thị **MOCK** thì cấu hình sai hoặc chưa restart FE

## 3.6.2 Kiểm thử chức năng FE

Thực hiện đủ 5 thao tác:

1. Tạo campaign mới
2. Tạo donation mới
3. Duyệt donation (`verified`)
4. Từ chối donation (`rejected`)
5. Refresh trang, dữ liệu vẫn còn

## 3.6.3 Trên máy QA (máy 6): kiểm thử kết nối và failover

### Kiểm tra kết nối đến 3 DB node

```powershell
Test-NetConnection DB1_IP -Port 27017
Test-NetConnection DB2_IP -Port 27017
Test-NetConnection DB3_IP -Port 27017
```

### Kiểm tra trạng thái Replica Set

```powershell
& "C:\Program Files\MongoDB\Server\7.0\bin\mongosh.exe" "mongodb://DB1_IP:27017,DB2_IP:27017,DB3_IP:27017/?replicaSet=rsCharity"
```

Trong `mongosh`:

```javascript
rs.status()
```

### Demo failover

- Nhờ người đang giữ node PRIMARY bấm `Ctrl + C` cửa sổ `mongod` để dừng node
- Đợi vài giây, chạy lại `rs.status()` từ máy QA
- Xác nhận có PRIMARY mới
- Bật lại node cũ bằng lệnh `mongod.exe --config ...`

## 3.6.4 Backup/Restore (máy QA)

Backup:

```powershell
$backupRoot = "C:\backup\charity"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir = Join-Path $backupRoot $timestamp
New-Item -ItemType Directory -Force $outDir | Out-Null
& "C:\Program Files\MongoDB\Tools\100\bin\mongodump.exe" --uri="mongodb://DB1_IP:27017,DB2_IP:27017,DB3_IP:27017/charity_distributed?replicaSet=rsCharity" --out=$outDir
```

Restore:

```powershell
$restorePath = "C:\backup\charity\TIMESTAMP\charity_distributed"
& "C:\Program Files\MongoDB\Tools\100\bin\mongorestore.exe" --uri="mongodb://DB1_IP:27017,DB2_IP:27017,DB3_IP:27017/charity_distributed?replicaSet=rsCharity" --drop $restorePath
```

## 4) Quy trình chạy demo chuẩn (đúng thứ tự)

1. Người 2,3,4 chạy `mongod` trên 3 máy DB
2. Người 4 khởi tạo `rs.initiate(...)` và xác nhận `rs.status()`
3. Người 5 chạy backend + kiểm tra `/health`
4. Người 6 chạy frontend với `VITE_USE_MOCK=false`
5. Người 6 thao tác nghiệp vụ trên FE
6. Người 6 + Người 4 demo failover
7. Người 6 demo backup/restore

## 5) Cách xử lý lỗi nhanh

### FE vẫn hiện MOCK

- Kiểm tra `fe/.env`: phải là `VITE_USE_MOCK=false`
- Tắt terminal FE, chạy lại `npm --prefix fe run dev`

### FE gọi API lỗi CORS

- Kiểm tra `.env` backend có `CORS_ORIGIN=http://localhost:5174,http://FE_IP:5174`
- Restart backend

### Backend không vào được Mongo

- Kiểm tra `MONGODB_URI` đúng IP + `replicaSet=rsCharity`
- Kiểm tra firewall 27017 trên 3 máy DB
- Kiểm tra `rs.status()`

### Node không lên SECONDARY

- Kiểm tra tên replica set trên cả 3 máy đều là `rsCharity`
- Kiểm tra host trong `rs.initiate` đúng `IP:27017`

## 6) Checklist nộp bài

- [ ] FE hiển thị nguồn dữ liệu BACKEND
- [ ] CRUD campaign/donation chạy trên FE
- [ ] Backend trả về `/health` và `/api/stats/overview`
- [ ] Replica set có 1 PRIMARY, 2 SECONDARY
- [ ] Demo failover thành công
- [ ] Demo backup và restore thành công
- [ ] Tài liệu phân công + lệnh chạy từng người đầy đủ
