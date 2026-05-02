# Hướng dẫn triển khai 6 máy - Hệ thống quản lý từ thiện phân tán

**Phiên bản 2.0** - Hỗ trợ MongoDB Sharded Cluster với contributions (đóng góp đa hình) và aid_distributions (hỗ trợ đa loại)

## 📋 Tóm tắt kiến trúc

| Máy | Vai trò | Dịch vụ | Port | Người được gán |
|---|---|---|---|---|
| **May 1** | Controller | FE + BE + mongos | 5174, 8080, 27017 | Người 1 |
| **May 2** | Shard 1 RS | 3 node MongoDB | 27110-27112 | Người 2 |
| **May 3** | Shard 2 RS | 3 node MongoDB | 27120-27122 | Người 3 |
| **May 4** | Shard 3 RS | 3 node MongoDB | 27130-27132 | Người 4 |
| **May 5** | Shard 4 RS | 3 node MongoDB | 27140-27142 | Người 5 |
| **May 6** | Shard 5 RS | 3 node MongoDB | 27150-27152 | Người 6 |

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
New-Item -ItemType Directory -Force "C:\mongodb\mongos\log" | Out-Null
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
Test-NetConnection M2_IP -Port 27110
Test-NetConnection M3_IP -Port 27120
Test-NetConnection M4_IP -Port 27130
Test-NetConnection M5_IP -Port 27140
Test-NetConnection M6_IP -Port 27150
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
mongosh --host M2_IP:27110

# Trong mongosh:
rs.initiate({
  _id: "shard1RS",
  members: [
    { _id: 0, host: "M2_IP:27110", priority: 1 },
    { _id: 1, host: "M2_IP:27111" },
    { _id: 2, host: "M2_IP:27112" }
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

### 3.1 Khởi động mongos (Terminal 1)
```powershell
$mongoPath = "C:\Program Files\MongoDB\Server\7.0\bin\mongos.exe"
& $mongoPath `
  --bind_ip 0.0.0.0 `
  --port 27017 `
  --logpath C:\mongodb\mongos\log\mongos.log `
  --logappend
```

### 3.2 Đăng ký Shard (Terminal 2)
```powershell
mongosh --host localhost:27017

# Trong mongosh:
sh.addShard("shard1RS/M2_IP:27110,M2_IP:27111,M2_IP:27112")
sh.addShard("shard2RS/M3_IP:27120,M3_IP:27121,M3_IP:27122")
sh.addShard("shard3RS/M4_IP:27130,M4_IP:27131,M4_IP:27132")
sh.addShard("shard4RS/M5_IP:27140,M5_IP:27141,M5_IP:27142")
sh.addShard("shard5RS/M6_IP:27150,M6_IP:27151,M6_IP:27152")

# Kiểm tra
sh.status()
```

### 3.3 Bật Sharding (vẫn trong mongosh)
```javascript
sh.enableSharding("charity_distributed")
sh.shardCollection("charity_distributed.contributions", { branchId: "hashed" })
sh.shardCollection("charity_distributed.aidistributions", { branchId: "hashed" })
sh.shardCollection("charity_distributed.activity_logs", { branchId: "hashed" })
```

### 3.4 Khởi động Backend (Terminal 3)
```powershell
cd ".\apps\backend"
npm install
npm run dev  # Backend: http://localhost:8080
```

### 3.5 Khởi động Frontend (Terminal 4)
```powershell
cd ".\apps\frontend"
npm install
npm run dev  # Frontend: http://localhost:5174
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
