# Hướng dẫn triển khai 6 máy - Hệ thống quản lý từ thiện phân tán

**Phiên bản 2.0** - Hỗ trợ MongoDB Sharded Cluster với contributions (đóng góp đa hình) và aid_distributions (hỗ trợ đa loại)

## 📋 Tóm tắt kiến trúc

| Máy | Vai trò | Dịch vụ | Port | Người được gán |
|---|---|---|---|---|
| **May 1 - Trung** | Controller | FE + BE + mongos | 5174, 8080, 27017 | Trung |
| **May 2 - Hieu** | Shard 1 RS | 3 node MongoDB | 27110-27112 | Hieu |
| **May 3 - Hau** | Shard 2 RS | 3 node MongoDB | 27120-27122 | Hau |
| **May 4 - Toan** | Shard 3 RS | 3 node MongoDB | 27130-27132 | Toan |
| **May 5 - Dung** | Shard 4 RS | 3 node MongoDB | 27140-27142 | Dung |
| **May 6 - Lam** | Shard 5 RS | 3 node MongoDB | 27150-27152 | Lam |

## 🚀 Bước 1: Chuẩn bị chung - TẤT CẢ 6 máy

### 1.1 Cài đặt Tailscale (để kết nối mạng)
```powershell
# Download: https://tailscale.com/download/windows
# Cài đặt và khởi chạy
tailscale up

# Lưu Tailscale IP của từng máy (ví dụ: 100.x.x.x)
```

### 1.2 Cài đặt MongoDB Community 7.x
```powershell
# Cách 1: Download từ https://www.mongodb.com/try/download/community
# Cách 2: Dùng chocolatey (nếu có)
choco install mongodb-community

# Kiểm tra
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --version
```

### 1.3 Tạo thư mục dữ liệu

**May 1** (Controller):
```powershell
New-Item -ItemType Directory -Force "E:\MongoDemo\mongos\log" | Out-Null
```

**May 2-6** (Shard nodes):
```powershell
# Ví dụ May 2 - Shard 1:
1..3 | ForEach-Object {
  New-Item -ItemType Directory -Force "C:\mongodb\shard1\node$_\data" | Out-Null
  New-Item -ItemType Directory -Force "C:\mongodb\shard1\node$_\log" | Out-Null
}

# Shard 2 (May 3) - thay "shard1" → "shard2"
# Tiếp tục cho shard 3,4,5...
```

### 1.4 Firewall rules

**May 1**:
```powershell
New-NetFirewallRule -DisplayName "Mongos-27017" -Direction Inbound -Protocol TCP -LocalPort 27017 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Backend-8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Frontend-5174" -Direction Inbound -Protocol TCP -LocalPort 5174 -Action Allow -ErrorAction SilentlyContinue
```

**May 2-6** (Ví dụ May 2):
```powershell
27110, 27111, 27112 | ForEach-Object {
  New-NetFirewallRule -DisplayName "Shard1-$_" -Direction Inbound -Protocol TCP -LocalPort $_ -Action Allow -ErrorAction SilentlyContinue
}
```

### 1.5 Kiểm tra kết nối từ May 1
```powershell
Test-NetConnection 100.106.101.66 -Port 27110
Test-NetConnection 100.70.25.109 -Port 27120
Test-NetConnection 100.86.128.18 -Port 27130
Test-NetConnection 100.125.201.49 -Port 27140
Test-NetConnection 100.79.175.92 -Port 27150
```

---

## ⚡ Bước 2: Khởi động May 2-6 (Shard nodes)

### Mẫu - May 2 (Shard 1)

**Terminal 1 - Node 1 (Port 27110)**:
```powershell
$mongoPath = "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
& $mongoPath `
  --bind_ip 0.0.0.0 `
  --port 27110 `
  --replSet "shard1RS" `
  --dbpath "C:\mongodb\shard1\node1\data" `
  --logpath "C:\mongodb\shard1\node1\log\mongod.log" `
  --logappend `
  --shardsvr
```

**Terminal 2 - Node 2 (Port 27111)**:
```powershell
$mongoPath = "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
& $mongoPath `
  --bind_ip 0.0.0.0 `
  --port 27111 `
  --replSet "shard1RS" `
  --dbpath "C:\mongodb\shard1\node2\data" `
  --logpath "C:\mongodb\shard1\node2\log\mongod.log" `
  --logappend `
  --shardsvr
```

**Terminal 3 - Node 3 (Port 27112)**:
```powershell
$mongoPath = "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
& $mongoPath `
  --bind_ip 0.0.0.0 `
  --port 27112 `
  --replSet "shard1RS" `
  --dbpath "C:\mongodb\shard1\node3\data" `
  --logpath "C:\mongodb\shard1\node3\log\mongod.log" `
  --logappend `
  --shardsvr
```

**Terminal 4 - Khởi tạo Replica Set**:
```powershell
mongosh --host 100.106.101.66:27110

# Trong mongosh:
rs.initiate({
  _id: "shard1RS",
  members: [
    { _id: 0, host: "100.106.101.66:27110", priority: 1 },
    { _id: 1, host: "100.106.101.66:27111" },
    { _id: 2, host: "100.106.101.66:27112" }
  ]
})

# Kiểm tra
rs.status()
```

### Tương tự May 3-6

| Máy | Shard | replSetName | Ports |
|---|---|---|---|
| May 3 | shard2 | shard2RS | 27120-27122 |
| May 4 | shard3 | shard3RS | 27130-27132 |
| May 5 | shard4 | shard4RS | 27140-27142 |
| May 6 | shard5 | shard5RS | 27150-27152 |

**⚠️ Chờ tất cả 5 shard PRIMARY đều elected**

---

## ⚡ Bước 3: Khởi động May 1 (Controller)

### 3.0 Khởi động Config Server replica set (bắt buộc trước mongos)

Tạo file `E:\MongoDemo\configsvr\configsvr.yml`:
```yaml
systemLog:
  destination: file
  path: E:\MongoDemo\configsvr\log\mongod.log
  logAppend: true
storage:
  dbPath: E:\MongoDemo\configsvr\data
net:
  bindIp: 0.0.0.0
  port: 27019
replication:
  replSetName: cfgRS
sharding:
  clusterRole: configsvr
```

Khởi động config server:
```powershell
New-Item -ItemType Directory -Force "E:\MongoDemo\configsvr\data" | Out-Null
New-Item -ItemType Directory -Force "E:\MongoDemo\configsvr\log" | Out-Null
mongod --config "E:\MongoDemo\configsvr\configsvr.yml"
```

Mở Terminal khác để khởi tạo `cfgRS`:
```powershell
mongosh --host 100.105.34.84:27019
```

```javascript
rs.initiate({
  _id: "cfgRS",
  configsvr: true,
  members: [
    { _id: 0, host: "100.105.34.84:27019" }
  ]
})
rs.status()
```

### 3.1 Khởi động mongos (Terminal 1)

Tạo file `E:\MongoDemo\mongos\mongos.yml`:
```yaml
systemLog:
  destination: file
  path: E:\MongoDemo\mongos\log\mongos.log
  logAppend: true
net:
  bindIp: 0.0.0.0
  port: 27017
sharding:
  configDB: cfgRS/100.105.34.84:27019
```

```powershell
New-Item -ItemType Directory -Force "E:\MongoDemo\mongos\log" | Out-Null
mongos --config "E:\MongoDemo\mongos\mongos.yml"
```

### 3.2 Đăng ký Shard (Terminal 2)
```powershell
mongosh --host 100.105.34.84:27017

# Trong mongosh:
sh.addShard("shard1RS/100.106.101.66:27110,100.106.101.66:27111,100.106.101.66:27112")
sh.addShard("shard2RS/100.70.25.109:27120,100.70.25.109:27121,100.70.25.109:27122")
sh.addShard("shard3RS/100.86.128.18:27130,100.86.128.18:27131,100.86.128.18:27132")
sh.addShard("shard4RS/100.125.201.49:27140,100.125.201.49:27141,100.125.201.49:27142")
sh.addShard("shard5RS/100.79.175.92:27150,100.79.175.92:27151,100.79.175.92:27152")

# Kiểm tra
sh.status()
```

### 3.3 Bật Sharding (vẫn trong mongosh)
```javascript
sh.enableSharding("charity_distributed")
sh.shardCollection("charity_distributed.contributions", { branchId: "hashed" })
sh.shardCollection("charity_distributed.aid_distributions", { branchId: "hashed" })
sh.shardCollection("charity_distributed.activity_logs", { branchId: "hashed" })
```

### 3.4 Khởi động Backend (Terminal 3)
```powershell
cd ".\apps\backend"
npm install
npm run dev  # Backend: http://100.105.34.84:8080
```

### 3.5 Khởi động Frontend (Terminal 4)
```powershell
cd ".\apps\frontend"
npm install
npm run dev  # Frontend: http://100.105.34.84:5174
```

---

## 🧪 Bước 4: Kiểm thử - Tạo dữ liệu mẫu

### Test Contributions (Đóng góp đa hình)
```powershell
# Tạo contribution - MONEY type
$moneyContrib = @{
  type = "MONEY"
  moneyDetail = @{
    amount = 5000000
    currency = "VND"
    paymentMethod = "BANK_TRANSFER"
    transactionCode = "TRX001"
  }
} | ConvertTo-Json

# Tạo contribution - ITEM type
$itemContrib = @{
  type = "ITEM"
  itemDetails = @(@{
    name = "Gạo"
    category = "FOOD"
    quantity = 5
    unit = "tấn"
    estimatedValue = 50000000
  })
} | ConvertTo-Json

# Tạo contribution - SERVICE type
# Tạo contribution - VOLUNTEER_WORK type
```

### Test Aid Distributions (Phát hỗ trợ)
```powershell
# Tạo aid distribution
# Duyệt (APPROVED)
# Phát hành (DELIVERED)
# Hoàn thành (COMPLETED)
```

---

## ✅ Checklist hoàn thành - 6 người

**Người 1 (May 1)**:
- [ ] Cài Tailscale, MongoDB, Node.js
- [ ] Khởi động mongos
- [ ] Đăng ký 5 shard
- [ ] Khởi động BE + FE
- [ ] Kiểm tra: http://localhost:5174

**Người 2-6** (May 2-6):
- [ ] Cài Tailscale, MongoDB
- [ ] Tạo 3 folder node
- [ ] Khởi động 3 mongod processes
- [ ] Khởi tạo Replica Set
- [ ] Kiểm tra rs.status()

**Kiểm thử chung**:
- [ ] Tạo Contribution MONEY
- [ ] Tạo Contribution ITEM
- [ ] Tạo Contribution SERVICE
- [ ] Tạo Contribution VOLUNTEER_WORK
- [ ] Tạo Aid Distribution
- [ ] Duyệt & Phát hành
- [ ] Kiểm tra activity logs
- [ ] Kiểm tra summaryStats

---

**Lần cập nhật**: Tháng 5, 2026 | Phiên bản 2.0
