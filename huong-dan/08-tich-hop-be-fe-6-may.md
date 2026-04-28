# Hướng dẫn triển khai thực tế 6 máy: Leader chạy FE + BE + QA, DB dùng Sharded Cluster

Tài liệu này dùng cho mô hình sát thực tế vận hành hơn:

- Leader chạy ứng dụng và điều phối kiểm thử: FE + BE + QA + mongos + cfg1
- ShardA1 không chạy trên Leader
- Cả 6 máy đều tham gia tầng database
- Dùng MongoDB Sharded Cluster chuẩn: mỗi shard là 1 Replica Set
- Cho phép 1 máy chạy nhiều node MongoDB

## 0) Kiến trúc mục tiêu

### 0.1 Vai trò 6 máy (đã chỉnh theo yêu cầu)

- Máy 1 (Leader): FE + BE + QA + mongos + cfg1
- Máy 2: cfg2 + shardA1
- Máy 3: cfg3 + shardA2
- Máy 4: shardA3 + shardB1
- Máy 5: shardB2
- Máy 6: shardB3

Như vậy:

- Leader không còn chạy shardA1
- Leader vẫn tham gia DB qua cfg1
- Cả 6 máy đều có vai trò DB

### 0.2 Thành phần cluster

- Config Server Replica Set: cfgRS (3 node)
- Shard 1 Replica Set: rsShardA (3 node)
- Shard 2 Replica Set: rsShardB (3 node)
- Query Router: mongos (chạy trên Leader)

## 1) Mapping IP và port (bắt buộc chốt trước khi chạy)

Điền IP Tailscale thật vào các placeholder bên dưới.

| Máy | IP | Vai trò DB | Port |
|---|---|---|---|
| Máy 1 | M1_IP | cfg1, mongos | 27101, 27017 |
| Máy 2 | M2_IP | cfg2, shardA1 | 27102, 27211 |
| Máy 3 | M3_IP | cfg3, shardA2 | 27103, 27212 |
| Máy 4 | M4_IP | shardA3, shardB1 | 27213, 27311 |
| Máy 5 | M5_IP | shardB2 | 27312 |
| Máy 6 | M6_IP | shardB3 | 27313 |

## 2) Chuẩn bị chung

### 2.1 Cài phần mềm

- Tailscale: cả 6 máy
- MongoDB Community Server 7.x: cả 6 máy (vì máy nào cũng chạy node DB)
- MongoDB Database Tools:
  - Bắt buộc: máy Leader (vì Leader chạy QA)
  - Khuyến nghị: máy 6 (để backup/restore độc lập)
- Node.js 20+: máy Leader

### 2.2 Kiểm tra mạng

Trên từng máy:

```powershell
tailscale status
tailscale ip -4
```

Từ Leader kiểm tra các port chính:

```powershell
Test-NetConnection M2_IP -Port 27102
Test-NetConnection M3_IP -Port 27103
Test-NetConnection M4_IP -Port 27213
Test-NetConnection M4_IP -Port 27311
Test-NetConnection M5_IP -Port 27312
Test-NetConnection M6_IP -Port 27313
```

## 3) Cấu hình và chạy node theo từng máy

Lưu ý chung:

- Chạy PowerShell quyền admin
- Mỗi node cần dbPath và log riêng
- Các file cấu hình dùng bindIp 0.0.0.0 để truy cập trong tailnet

### 3.1 Máy 1 (Leader): cfg1 + mongos + FE/BE/QA

Tạo thư mục:

```powershell
New-Item -ItemType Directory -Force C:\mongodb\cfg1\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\cfg1\log  | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\mongos\log | Out-Null
```

Tạo file C:\mongodb\cfg1\mongod-cfg1.yml:

```yaml
storage:
  dbPath: C:\mongodb\cfg1\data
systemLog:
  destination: file
  path: C:\mongodb\cfg1\log\mongod-cfg1.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27101
replication:
  replSetName: cfgRS
sharding:
  clusterRole: configsvr
```

Mở firewall:

```powershell
New-NetFirewallRule -DisplayName "Mongo-cfg1-27101" -Direction Inbound -Protocol TCP -LocalPort 27101 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Mongo-mongos-27017" -Direction Inbound -Protocol TCP -LocalPort 27017 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Leader-BE-8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Leader-FE-5174" -Direction Inbound -Protocol TCP -LocalPort 5174 -Action Allow -ErrorAction SilentlyContinue
```

Chạy cfg1:

```powershell
mongod --config E:\WINDOW\BTL\CSDLPT\mongodb\cfg1\mongod-cfg1.yml
```

### 3.2 Máy 2: cfg2 + shardA1

Tạo thư mục:

```powershell
New-Item -ItemType Directory -Force C:\mongodb\cfg2\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\cfg2\log  | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shardA1\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shardA1\log  | Out-Null
```

Tạo C:\mongodb\cfg2\mongod-cfg2.yml:

```yaml
storage:
  dbPath: C:\mongodb\cfg2\data
systemLog:
  destination: file
  path: C:\mongodb\cfg2\log\mongod-cfg2.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27102
replication:
  replSetName: cfgRS
sharding:
  clusterRole: configsvr
```

Tạo C:\mongodb\shardA1\mongod-shardA1.yml:

```yaml
storage:
  dbPath: C:\mongodb\shardA1\data
systemLog:
  destination: file
  path: C:\mongodb\shardA1\log\mongod-shardA1.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27211
replication:
  replSetName: rsShardA
sharding:
  clusterRole: shardsvr
```

Mở firewall và chạy:

```powershell
New-NetFirewallRule -DisplayName "Mongo-cfg2-27102" -Direction Inbound -Protocol TCP -LocalPort 27102 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Mongo-shardA1-27211" -Direction Inbound -Protocol TCP -LocalPort 27211 -Action Allow -ErrorAction SilentlyContinue
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\cfg2\mongod-cfg2.yml
```

```powershell
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --config C:\mongodb\shardA1\mongod-shardA1.yml
```

### 3.3 Máy 3: cfg3 + shardA2

```powershell
New-Item -ItemType Directory -Force C:\mongodb\cfg3\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\cfg3\log  | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shardA2\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shardA2\log  | Out-Null
```

C:\mongodb\cfg3\mongod-cfg3.yml (27103, cfgRS, configsvr) và C:\mongodb\shardA2\mongod-shardA2.yml (27212, rsShardA, shardsvr) tương tự máy 2.

```powershell
New-NetFirewallRule -DisplayName "Mongo-cfg3-27103" -Direction Inbound -Protocol TCP -LocalPort 27103 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Mongo-shardA2-27212" -Direction Inbound -Protocol TCP -LocalPort 27212 -Action Allow -ErrorAction SilentlyContinue
mongod --config C:\mongodb\cfg3\mongod-cfg3.yml
```

```powershell
mongod --config C:\mongodb\shardA2\mongod-shardA2.yml
```

### 3.4 Máy 4: shardA3 + shardB1

```powershell
New-Item -ItemType Directory -Force C:\mongodb\shardA3\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shardA3\log  | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shardB1\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shardB1\log  | Out-Null
```

C:\mongodb\shardA3\mongod-shardA3.yml:

```yaml
storage:
  dbPath: D:\mongodb\shardA3\data
systemLog:
  destination: file
  path: D:\mongodb\shardA3\log\mongod-shardA3.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27213
replication:
  replSetName: rsShardA
sharding:
  clusterRole: shardsvr
```

C:\mongodb\shardB1\mongod-shardB1.yml:

```yaml
storage:
  dbPath: D:\mongodb\shardB1\data
systemLog:
  destination: file
  path: D:\mongodb\shardB1\log\mongod-shardB1.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27311
replication:
  replSetName: rsShardB
sharding:
  clusterRole: shardsvr
```

```powershell
New-NetFirewallRule -DisplayName "Mongo-shardA3-27213" -Direction Inbound -Protocol TCP -LocalPort 27213 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Mongo-shardB1-27311" -Direction Inbound -Protocol TCP -LocalPort 27311 -Action Allow -ErrorAction SilentlyContinue
mongod --config D:\mongodb\shardA3\mongod-shardA3.yml
```

```powershell
mongod --config D:\mongodb\shardB1\mongod-shardB1.yml
```

### 3.5 Máy 5: shardB2

```powershell
New-Item -ItemType Directory -Force C:\mongodb\shardB2\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shardB2\log  | Out-Null
```

C:\mongodb\shardB2\mongod-shardB2.yml tương tự shardB1, đổi port 27312.

```powershell
New-NetFirewallRule -DisplayName "Mongo-shardB2-27312" -Direction Inbound -Protocol TCP -LocalPort 27312 -Action Allow -ErrorAction SilentlyContinue
& "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --config D:\mongodb\shardB2\mongod-shardB2.yml
```

### 3.6 Máy 6: shardB3

```powershell
New-Item -ItemType Directory -Force C:\mongodb\shardB3\data | Out-Null
New-Item -ItemType Directory -Force C:\mongodb\shardB3\log  | Out-Null
```

C:\mongodb\shardB3\mongod-shardB3.yml tương tự shardB1, đổi port 27313.

```powershell
mkdir -p ~/mongodb/shardB3/{data,log}

nano ~/mongodb/shardB3/mongod-shardB3.yml

storage:
  dbPath: /Users/apple/mongodb/shardB3/data

systemLog:
  destination: file
  path: /Users/apple/mongodb/shardB3/log/mongod-shardB3.log
  logAppend: true

net:
  bindIp: 0.0.0.0
  port: 27313

replication:
  replSetName: rsShardB

sharding:
  clusterRole: shardsvr
```

## 4) Khởi tạo cluster sharding (thực hiện từ Leader)

### 4.1 Khởi tạo cfgRS

```powershell
& "C:\Program Files\MongoDB\Server\7.0\bin\mongosh.exe" "mongodb://M1_IP:27101"
mongosh mongodb://100.93.54.47:27101
```

```javascript
rs.initiate({
  _id: "cfgRS",
  configsvr: true,
  members: [
    { _id: 0, host: "100.93.54.47:27101" },
    { _id: 1, host: "100.70.25.109:27102" },
    { _id: 2, host: "100.106.101.66:27103" }
  ]
})
rs.status()
```

### 4.2 Khởi tạo rsShardA

```powershell
& "C:\Program Files\MongoDB\Server\7.0\bin\mongosh.exe" "mongodb://M2_IP:27211"
mongosh mongodb://100.70.25.109:27211
```

```javascript
rs.initiate({
  _id: "rsShardA",
  members: [
    { _id: 0, host: "100.70.25.109:27211" },
    { _id: 1, host: "100.106.101.66:27212" },
    { _id: 2, host: "100.86.128.18:27213" }
  ]
})
rs.status()
```

### 4.3 Khởi tạo rsShardB

```powershell
& "C:\Program Files\MongoDB\Server\7.0\bin\mongosh.exe" "mongodb://M4_IP:27311"
mongosh mongodb://100.86.128.18:27311
```

```javascript
rs.initiate({
  _id: "rsShardB",
  members: [
    { _id: 0, host: "100.86.128.18:27311" },
    { _id: 1, host: "100.125.201.49:27312" },
    { _id: 2, host: "100.79.175.92:27313" }
  ]
})
rs.status()
```

### 4.4 Chạy mongos trên Leader

```powershell
mongos --configdb cfgRS/100.93.54.47:27101,100.70.25.109:27102,100.106.101.66:27103 --bind_ip 0.0.0.0 --port 27017 --logpath E:\WINDOW\BTL\CSDLPT\mongodb\mongos\log\mongos.log --logappend
```

### 4.5 Add shard vào cluster

```powershell
mongosh mongodb://100.93.54.47:27017
```

```javascript
sh.addShard("rsShardA/100.70.25.109:27211,100.106.101.66:27212,100.86.128.18:27213")
sh.addShard("rsShardB/100.86.128.18:27311,100.125.201.49:27312,100.79.175.92:27313")
sh.status()
```

## 5) Leader chạy cả BE, FE và QA

### 5.1 Backend trên Leader

Sửa file .env ở root project:

```env
PORT=8080
NODE_ENV=development
MONGODB_URI=mongodb://M1_IP:27017/charity_distributed
CORS_ORIGIN=http://localhost:5174,http://M1_IP:5174
```

```powershell
npm install
npm --prefix apps/backend install
npm --prefix apps/backend run dev
```

### 5.2 Frontend trên Leader

Sửa file fe/.env:

```env
VITE_API_BASE=http://M1_IP:8080/api
VITE_USE_MOCK=false
```

```powershell
npm --prefix fe install
npm --prefix fe run dev
```

### 5.3 QA trên Leader

Test API:

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/health"
Invoke-RestMethod -Uri "http://localhost:8080/api/stats/overview"
```

Kiểm tra shard:

```powershell
& "C:\Program Files\MongoDB\Server\7.0\bin\mongosh.exe" "mongodb://M1_IP:27017"
```

```javascript
sh.status()
```

Failover test:

- Dừng PRIMARY của rsShardA, kiểm tra election, tạo donation từ FE
- Dừng PRIMARY của rsShardB, kiểm tra election, tạo donation/campaign từ FE

Backup/restore trên Leader:

```powershell
$backupRoot = "C:\backup\charity"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir = Join-Path $backupRoot $timestamp
New-Item -ItemType Directory -Force $outDir | Out-Null
& "C:\Program Files\MongoDB\Tools\100\bin\mongodump.exe" --uri="mongodb://M1_IP:27017/charity_distributed" --out=$outDir
```

```powershell
$restorePath = "C:\backup\charity\TIMESTAMP\charity_distributed"
& "C:\Program Files\MongoDB\Tools\100\bin\mongorestore.exe" --uri="mongodb://M1_IP:27017/charity_distributed" --drop $restorePath
```

## 6) Phân mảnh dữ liệu hiện tại: đang dựa trên gì, vì sao, và dữ liệu vào shard nào

### 6.1 Hiện đang shard theo gì

Trong tài liệu vận hành hiện tại, collection donations được cấu hình shard key:

- donations: { campaignCode: "hashed" }

Lệnh đã ghi trong tài liệu:

```javascript
sh.enableSharding("charity_distributed")
sh.shardCollection("charity_distributed.donations", { campaignCode: "hashed" })
```

### 6.2 Vì sao chọn campaignCode hashed

- Hệ thống truy vấn theo campaignCode nhiều (lọc donation theo chiến dịch)
- campaignCode có tính nghiệp vụ rõ, dễ giải thích trong báo cáo
- Dùng hashed giúp phân tán ghi đều hơn giữa các shard, giảm lệch tải khi một số campaign có nhiều donation
- Phù hợp demo thực tế vì vẫn giữ nghĩa nghiệp vụ nhưng tránh hotspot kiểu range key đơn giản

### 6.3 Dữ liệu phân vào shard như thế nào

- Mongos nhận request ghi từ backend
- MongoDB hash giá trị campaignCode
- Dựa vào chunk range trong metadata để route đến shard chứa chunk đó
- Các shard trong cluster hiện tại:
  - rsShardA: M2/M3/M4
  - rsShardB: M4/M5/M6
- Theo thời gian, balancer sẽ tự cân lại chunk để phân phối dữ liệu đều hơn giữa rsShardA và rsShardB

Lưu ý quan trọng:

- Code backend không tự tạo sharding
- Sharding chỉ có hiệu lực sau khi chạy các lệnh ở mục 4.5 và mục 6.1 trên mongos

## 7) Bảng lệnh tóm tắt theo từng máy

| Máy | Dịch vụ chính | Lệnh chính |
|---|---|---|
| Máy 1 | cfg1, mongos, FE, BE, QA | chạy mongod cfg1, mongos, npm backend, npm frontend, test và dump/restore |
| Máy 2 | cfg2, shardA1 | chạy mongod cfg2 và mongod shardA1 |
| Máy 3 | cfg3, shardA2 | chạy mongod cfg3 và mongod shardA2 |
| Máy 4 | shardA3, shardB1 | chạy 2 mongod shard |
| Máy 5 | shardB2 | chạy mongod shardB2 |
| Máy 6 | shardB3 | chạy mongod shardB3 |

## 8) Checklist hoàn tất

- [ ] Leader chạy ổn định FE + BE + QA + mongos + cfg1
- [ ] cfgRS có 1 PRIMARY, 2 SECONDARY
- [ ] rsShardA có 1 PRIMARY, 2 SECONDARY
- [ ] rsShardB có 1 PRIMARY, 2 SECONDARY
- [ ] sh.status() hiển thị đủ 2 shard
- [ ] donations đã shard theo campaignCode hashed
- [ ] Tạo donation từ FE và đọc lại thành công
- [ ] Demo failover cả rsShardA và rsShardB thành công
- [ ] Demo backup/restore thành công
