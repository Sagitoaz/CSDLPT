# Hướng dẫn triển khai 6 máy theo mô hình controller + replica set 3 node

Tài liệu này mô tả mô hình demo sát thực tế hơn cho nhóm:

- Máy 1 là máy trung tâm điều khiển, chạy FE, BE, QA và `mongos`.
- Máy 2 đến Máy 6 đều là các máy dữ liệu.
- Trên mỗi máy dữ liệu sẽ mô phỏng một replica set 3 node gồm 1 primary và 2 secondary.
- Cách làm này giúp luôn có secondary backup cho primary, đúng ý tưởng triển khai thực tế.

## 0) Kiến trúc mục tiêu

### 0.1 Vai trò 6 máy

- Máy 1: Trung tâm điều khiển, chạy FE + BE + QA + `mongos`
- Máy 2: Replica set dữ liệu trung tâm, gồm 3 node logic
- Máy 3: Replica set shard 1, gồm 3 node logic
- Máy 4: Replica set shard 2, gồm 3 node logic
- Máy 5: Replica set shard 3, gồm 3 node logic
- Máy 6: Replica set shard 4, gồm 3 node logic

### 0.2 Ý nghĩa mô phỏng

Trong báo cáo, có thể giải thích như sau:

- Máy 1 là điểm truy cập chính của hệ thống.
- Máy 2 là cụm dữ liệu trung tâm.
- Máy 3 đến Máy 6 là các cụm shard.
- Mỗi cụm dữ liệu đều được tổ chức theo replica set 3 node để có primary và secondary dự phòng.
- Do giới hạn hạ tầng demo, 3 node của một replica set có thể được chạy bằng 3 tiến trình `mongod` trên cùng một máy vật lý.

### 0.3 Thành phần hệ thống

- Frontend: chạy trên Máy 1
- Backend: chạy trên Máy 1
- QA / Demo / Điều phối: chạy trên Máy 1
- Query router `mongos`: chạy trên Máy 1
- Cụm dữ liệu trung tâm: chạy trên Máy 2
- 4 cụm shard: chạy trên Máy 3, 4, 5, 6

## 1) Mapping IP và port

Điền IP Tailscale thật vào các placeholder bên dưới.

| Máy | Vai trò | IP placeholder | Port |
|---|---|---|---|
| Máy 1 | Trung tâm | M1_IP | 8080, 5174, 27017 |
| Máy 2 | Replica set trung tâm | M2_IP | 27110, 27111, 27112 |
| Máy 3 | Replica set shard 1 | M3_IP | 27120, 27121, 27122 |
| Máy 4 | Replica set shard 2 | M4_IP | 27130, 27131, 27132 |
| Máy 5 | Replica set shard 3 | M5_IP | 27140, 27141, 27142 |
| Máy 6 | Replica set shard 4 | M6_IP | 27150, 27151, 27152 |

## 2) Chuẩn bị chung

### 2.1 Cài phần mềm

- Tailscale: cả 6 máy
- MongoDB Community Server 7.x: cả 6 máy
- MongoDB Database Tools: máy 1 để backup/restore
- Node.js 20+: máy 1

### 2.2 Kiểm tra mạng

Trên từng máy:

```powershell
tailscale status
tailscale ip -4
```

Từ máy 1 kiểm tra kết nối đến các node dữ liệu:

```powershell
Test-NetConnection M2_IP -Port 27110
Test-NetConnection M2_IP -Port 27111
Test-NetConnection M2_IP -Port 27112
Test-NetConnection M3_IP -Port 27120
Test-NetConnection M3_IP -Port 27121
Test-NetConnection M3_IP -Port 27122
Test-NetConnection M4_IP -Port 27130
Test-NetConnection M4_IP -Port 27131
Test-NetConnection M4_IP -Port 27132
Test-NetConnection M5_IP -Port 27140
Test-NetConnection M5_IP -Port 27141
Test-NetConnection M5_IP -Port 27142
Test-NetConnection M6_IP -Port 27150
Test-NetConnection M6_IP -Port 27151
Test-NetConnection M6_IP -Port 27152
```

## 3) Cấu hình theo từng máy

Lưu ý chung:

- Chạy PowerShell quyền admin.
- Mỗi replica set có 3 node logic: 1 primary và 2 secondary.
- Mỗi node logic dùng một port riêng và một dbPath riêng.
- Dùng `bindIp: 0.0.0.0` để các máy trong tailnet truy cập được.
- Đây là mô hình mô phỏng. Trong sản phẩm thật, các node của cùng một replica set nên đặt trên các host khác nhau để tăng độ sẵn sàng.

### 3.1 Máy 1: Trung tâm điều khiển

Tạo thư mục:

```powershell
New-Item -ItemType Directory -Force C:\mongodb\mongos\log | Out-Null
```

Mở firewall:

```powershell
New-NetFirewallRule -DisplayName "Mongo-mongos-27017" -Direction Inbound -Protocol TCP -LocalPort 27017 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Leader-BE-8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Leader-FE-5174" -Direction Inbound -Protocol TCP -LocalPort 5174 -Action Allow -ErrorAction SilentlyContinue
```

Chạy `mongos` trên máy 1:

```powershell
& "C:\Program Files\MongoDB\Server\7.0\bin\mongos.exe" --bind_ip 0.0.0.0 --port 27017 --logpath C:\mongodb\mongos\log\mongos.log --logappend
```

Chạy backend:

```powershell
npm install
npm --prefix apps/backend install
npm --prefix apps/backend run dev
```

Chạy frontend:

```powershell
npm --prefix apps/frontend install
npm --prefix apps/frontend run dev
```

Kiểm tra QA:

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/health"
Invoke-RestMethod -Uri "http://localhost:8080/api/stats/overview"
```

### 3.2 Máy 2: Replica set dữ liệu trung tâm

```powershell
New-Item -ItemType Directory -Force C:\mongodb\central\node1\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\central\node1\log | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\central\node2\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\central\node2\log | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\central\node3\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\central\node3\log | Out-Null
```

Tạo 3 file cấu hình:

```yaml
storage:
  dbPath: C:\mongodb\central\node1\data
systemLog:
  destination: file
  path: C:\mongodb\central\node1\log\mongod-central-1.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27110
replication:
  replSetName: centralRS
---
storage:
  dbPath: C:\mongodb\central\node2\data
systemLog:
  destination: file
  path: C:\mongodb\central\node2\log\mongod-central-2.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27111
replication:
  replSetName: centralRS
---
storage:
  dbPath: C:\mongodb\central\node3\data
systemLog:
  destination: file
  path: C:\mongodb\central\node3\log\mongod-central-3.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27112
replication:
  replSetName: centralRS
```

Chạy 3 node trên máy 2:

```powershell
New-NetFirewallRule -DisplayName "Mongo-central-27110" -Direction Inbound -Protocol TCP -LocalPort 27110 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Mongo-central-27111" -Direction Inbound -Protocol TCP -LocalPort 27111 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Mongo-central-27112" -Direction Inbound -Protocol TCP -LocalPort 27112 -Action Allow -ErrorAction SilentlyContinue
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\central\node1\mongod-central-1.yml
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\central\node2\mongod-central-2.yml
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\central\node3\mongod-central-3.yml
```

Replica set logic:

- Node 1: primary
- Node 2: secondary
- Node 3: secondary

### 3.2.1 Khởi tạo replica set trung tâm

Sau khi 3 tiến trình `mongod` đã chạy, vào `mongosh` tại một trong các node của Máy 2 và chạy:

```javascript
rs.initiate({
  _id: "centralRS",
  members: [
    { _id: 0, host: "M2_IP:27110" },
    { _id: 1, host: "M2_IP:27111" },
    { _id: 2, host: "M2_IP:27112" }
  ]
})
rs.status()
```

### 3.3 Máy 3: Replica set shard 1

```powershell
New-Item -ItemType Directory -Force C:\mongodb\shard1\node1\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard1\node1\log | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard1\node2\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard1\node2\log | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard1\node3\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard1\node3\log | Out-Null
```

Tạo 3 file cấu hình:

```yaml
storage:
  dbPath: C:\mongodb\shard1\node1\data
systemLog:
  destination: file
  path: C:\mongodb\shard1\node1\log\mongod-shard1-1.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27120
replication:
  replSetName: shard1RS
---
storage:
  dbPath: C:\mongodb\shard1\node2\data
systemLog:
  destination: file
  path: C:\mongodb\shard1\node2\log\mongod-shard1-2.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27121
replication:
  replSetName: shard1RS
---
storage:
  dbPath: C:\mongodb\shard1\node3\data
systemLog:
  destination: file
  path: C:\mongodb\shard1\node3\log\mongod-shard1-3.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27122
replication:
  replSetName: shard1RS
```

```powershell
New-NetFirewallRule -DisplayName "Mongo-shard1-27120" -Direction Inbound -Protocol TCP -LocalPort 27120 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Mongo-shard1-27121" -Direction Inbound -Protocol TCP -LocalPort 27121 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Mongo-shard1-27122" -Direction Inbound -Protocol TCP -LocalPort 27122 -Action Allow -ErrorAction SilentlyContinue
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\shard1\node1\mongod-shard1-1.yml
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\shard1\node2\mongod-shard1-2.yml
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\shard1\node3\mongod-shard1-3.yml
```

Replica set logic:

- Node 1: primary
- Node 2: secondary
- Node 3: secondary

### 3.3.1 Khởi tạo replica set shard 1

```javascript
rs.initiate({
  _id: "shard1RS",
  members: [
    { _id: 0, host: "M3_IP:27120" },
    { _id: 1, host: "M3_IP:27121" },
    { _id: 2, host: "M3_IP:27122" }
  ]
})
rs.status()
```

### 3.4 Máy 4: Replica set shard 2

```powershell
New-Item -ItemType Directory -Force C:\mongodb\shard2\node1\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard2\node1\log | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard2\node2\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard2\node2\log | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard2\node3\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard2\node3\log | Out-Null
```

Tạo 3 file cấu hình:

```yaml
storage:
  dbPath: C:\mongodb\shard2\node1\data
systemLog:
  destination: file
  path: C:\mongodb\shard2\node1\log\mongod-shard2-1.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27130
replication:
  replSetName: shard2RS
---
storage:
  dbPath: C:\mongodb\shard2\node2\data
systemLog:
  destination: file
  path: C:\mongodb\shard2\node2\log\mongod-shard2-2.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27131
replication:
  replSetName: shard2RS
---
storage:
  dbPath: C:\mongodb\shard2\node3\data
systemLog:
  destination: file
  path: C:\mongodb\shard2\node3\log\mongod-shard2-3.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27132
replication:
  replSetName: shard2RS
```

```powershell
New-NetFirewallRule -DisplayName "Mongo-shard2-27130" -Direction Inbound -Protocol TCP -LocalPort 27130 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Mongo-shard2-27131" -Direction Inbound -Protocol TCP -LocalPort 27131 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Mongo-shard2-27132" -Direction Inbound -Protocol TCP -LocalPort 27132 -Action Allow -ErrorAction SilentlyContinue
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\shard2\node1\mongod-shard2-1.yml
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\shard2\node2\mongod-shard2-2.yml
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\shard2\node3\mongod-shard2-3.yml
```

Replica set logic:

- Node 1: primary
- Node 2: secondary
- Node 3: secondary

### 3.4.1 Khởi tạo replica set shard 2

```javascript
rs.initiate({
  _id: "shard2RS",
  members: [
    { _id: 0, host: "M4_IP:27130" },
    { _id: 1, host: "M4_IP:27131" },
    { _id: 2, host: "M4_IP:27132" }
  ]
})
rs.status()
```

### 3.5 Máy 5: Replica set shard 3

```powershell
New-Item -ItemType Directory -Force C:\mongodb\shard3\node1\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard3\node1\log | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard3\node2\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard3\node2\log | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard3\node3\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard3\node3\log | Out-Null
```

Tạo 3 file cấu hình:

```yaml
storage:
  dbPath: C:\mongodb\shard3\node1\data
systemLog:
  destination: file
  path: C:\mongodb\shard3\node1\log\mongod-shard3-1.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27140
replication:
  replSetName: shard3RS
---
storage:
  dbPath: C:\mongodb\shard3\node2\data
systemLog:
  destination: file
  path: C:\mongodb\shard3\node2\log\mongod-shard3-2.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27141
replication:
  replSetName: shard3RS
---
storage:
  dbPath: C:\mongodb\shard3\node3\data
systemLog:
  destination: file
  path: C:\mongodb\shard3\node3\log\mongod-shard3-3.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27142
replication:
  replSetName: shard3RS
```

```powershell
New-NetFirewallRule -DisplayName "Mongo-shard3-27140" -Direction Inbound -Protocol TCP -LocalPort 27140 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Mongo-shard3-27141" -Direction Inbound -Protocol TCP -LocalPort 27141 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Mongo-shard3-27142" -Direction Inbound -Protocol TCP -LocalPort 27142 -Action Allow -ErrorAction SilentlyContinue
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\shard3\node1\mongod-shard3-1.yml
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\shard3\node2\mongod-shard3-2.yml
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\shard3\node3\mongod-shard3-3.yml
```

Replica set logic:

- Node 1: primary
- Node 2: secondary
- Node 3: secondary

### 3.5.1 Khởi tạo replica set shard 3

```javascript
rs.initiate({
  _id: "shard3RS",
  members: [
    { _id: 0, host: "M5_IP:27140" },
    { _id: 1, host: "M5_IP:27141" },
    { _id: 2, host: "M5_IP:27142" }
  ]
})
rs.status()
```

### 3.6 Máy 6: Replica set shard 4

```powershell
New-Item -ItemType Directory -Force C:\mongodb\shard4\node1\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard4\node1\log | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard4\node2\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard4\node2\log | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard4\node3\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shard4\node3\log | Out-Null
```

Tạo 3 file cấu hình:

```yaml
storage:
  dbPath: C:\mongodb\shard4\node1\data
systemLog:
  destination: file
  path: C:\mongodb\shard4\node1\log\mongod-shard4-1.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27150
replication:
  replSetName: shard4RS
---
storage:
  dbPath: C:\mongodb\shard4\node2\data
systemLog:
  destination: file
  path: C:\mongodb\shard4\node2\log\mongod-shard4-2.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27151
replication:
  replSetName: shard4RS
---
storage:
  dbPath: C:\mongodb\shard4\node3\data
systemLog:
  destination: file
  path: C:\mongodb\shard4\node3\log\mongod-shard4-3.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27152
replication:
  replSetName: shard4RS
```

```powershell
New-NetFirewallRule -DisplayName "Mongo-shard4-27150" -Direction Inbound -Protocol TCP -LocalPort 27150 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Mongo-shard4-27151" -Direction Inbound -Protocol TCP -LocalPort 27151 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Mongo-shard4-27152" -Direction Inbound -Protocol TCP -LocalPort 27152 -Action Allow -ErrorAction SilentlyContinue
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\shard4\node1\mongod-shard4-1.yml
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\shard4\node2\mongod-shard4-2.yml
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\shard4\node3\mongod-shard4-3.yml
```

Replica set logic:

- Node 1: primary
- Node 2: secondary
- Node 3: secondary

### 3.6.1 Khởi tạo replica set shard 4

```javascript
rs.initiate({
  _id: "shard4RS",
  members: [
    { _id: 0, host: "M6_IP:27150" },
    { _id: 1, host: "M6_IP:27151" },
    { _id: 2, host: "M6_IP:27152" }
  ]
})
rs.status()
```

## 4) Đăng ký shard vào mongos

Sau khi máy 1 đã chạy `mongos`, vào `mongosh` trên máy 1 và thực hiện các lệnh sau để gom các replica set vào cụm phân tán:

```javascript
sh.addShard("centralRS/M2_IP:27110,M2_IP:27111,M2_IP:27112")
sh.addShard("shard1RS/M3_IP:27120,M3_IP:27121,M3_IP:27122")
sh.addShard("shard2RS/M4_IP:27130,M4_IP:27131,M4_IP:27132")
sh.addShard("shard3RS/M5_IP:27140,M5_IP:27141,M5_IP:27142")
sh.addShard("shard4RS/M6_IP:27150,M6_IP:27151,M6_IP:27152")
sh.status()
```

### 4.1 Bật sharding cho database demo

```javascript
sh.enableSharding("charity_distributed")
sh.shardCollection("charity_distributed.donations", { campaignCode: 1 })
```

Nếu nhóm muốn mô phỏng chia theo vùng hợp lý hơn, có thể thay key bằng hashed:

```javascript
sh.shardCollection("charity_distributed.donations", { campaignCode: "hashed" })
```

## 5) Tổ chức dữ liệu phân mảnh

### 4.1 Nguyên tắc phân mảnh

Dữ liệu nên phân tách theo `campaignCode` vì:

- Mọi donation đều gắn với một chiến dịch.
- Truy vấn nghiệp vụ thường lọc theo chiến dịch.
- Dễ giải thích trong báo cáo và demo.
- Dễ đối chiếu giữa các shard và cụm trung tâm.

### 4.2 Mô hình dữ liệu

Trong bản mô phỏng này:

- Replica set trung tâm giữ dữ liệu lõi.
- Replica set shard 1 giữ một vùng dữ liệu phân mảnh.
- Replica set shard 2 giữ một vùng dữ liệu phân mảnh.
- Replica set shard 3 giữ một vùng dữ liệu phân mảnh.
- Replica set shard 4 giữ một vùng dữ liệu phân mảnh.

Có thể mô tả theo mã chiến dịch như sau:

- `CAMPAIGN_001` - `CAMPAIGN_125` -> Shard 1
- `CAMPAIGN_126` - `CAMPAIGN_250` -> Shard 2
- `CAMPAIGN_251` - `CAMPAIGN_375` -> Shard 3
- `CAMPAIGN_376` - `CAMPAIGN_500` -> Shard 4

### 4.3 Lý do chọn cách này

- Mỗi cụm đều có primary và secondary backup.
- Cách mô phỏng này sát replica set thực tế hơn.
- Máy 1 vẫn là điểm điều khiển tập trung.
- Máy 2 là db trung tâm 3 node.
- 4 shard còn lại cũng đều có 3 node để demo failover và backup.

## 6) Kiểm thử từ máy trung tâm

Trên Máy 1, chạy các lệnh demo:

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/health"
Invoke-RestMethod -Uri "http://localhost:8080/api/stats/overview"
```

Nếu nhóm muốn mô phỏng truy vấn trung tâm, có thể làm ở Máy 1 như sau:

- tạo campaign
- tạo donation
- lọc donation theo campaignCode
- xem thống kê
- kiểm tra phản hồi từ cụm trung tâm và các replica set shard

## 7) Bảng tóm tắt theo từng máy

| Máy | Vai trò | Nhiệm vụ chính |
|---|---|---|
| Máy 1 | Trung tâm | FE, BE, QA, `mongos`, điều phối demo |
| Máy 2 | Replica set trung tâm | 1 primary, 2 secondary |
| Máy 3 | Replica set shard 1 | 1 primary, 2 secondary |
| Máy 4 | Replica set shard 2 | 1 primary, 2 secondary |
| Máy 5 | Replica set shard 3 | 1 primary, 2 secondary |
| Máy 6 | Replica set shard 4 | 1 primary, 2 secondary |

## 8) Checklist hoàn tất

- [ ] Máy 1 chạy FE + BE + QA + `mongos`
- [ ] Máy 2 chạy replica set trung tâm 3 node
- [ ] Máy 3 đến Máy 6 chạy replica set shard 3 node
- [ ] Mỗi replica set có 1 primary và 2 secondary
- [ ] Mỗi node chạy một port riêng
- [ ] Truy vấn demo được thực hiện từ máy 1
- [ ] Dữ liệu được phân mảnh theo `campaignCode`
- [ ] Kịch bản phù hợp mô hình controller + replica set trung tâm + 4 replica set shard


