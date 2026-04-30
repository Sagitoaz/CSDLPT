# Huong dan trien khai 6 may theo mo hinh controller + 5 shard ngang hang

Tai lieu nay cap nhat topology moi:
- May 1: controller, chay FE + BE + QA + mongos.
- May 2..May 6: 5 shard ngang hang, moi may mo phong 1 replica set 3 node logic.
- Khong con "cum du lieu trung tam" rieng.

## 0) Kien truc muc tieu

### 0.1 Vai tro 6 may
- May 1: Controller (FE, BE, QA, mongos)
- May 2: Shard 1 (replica set 3 node)
- May 3: Shard 2 (replica set 3 node)
- May 4: Shard 3 (replica set 3 node)
- May 5: Shard 4 (replica set 3 node)
- May 6: Shard 5 (replica set 3 node)

### 0.2 Nguyen tac
- 5 shard ngang hang, cung vai tro chuc nang.
- Du lieu duoc phan bo theo chunk qua shard key.
- Moi shard co 1 primary + 2 secondary de demo failover.

## 1) Mapping IP va port

| May | Vai tro | IP placeholder | Port |
|---|---|---|---|
| May 1 | Controller | M1_IP | 8080, 5174, 27017 |
| May 2 | Shard 1 RS | M2_IP | 27110, 27111, 27112 |
| May 3 | Shard 2 RS | M3_IP | 27120, 27121, 27122 |
| May 4 | Shard 3 RS | M4_IP | 27130, 27131, 27132 |
| May 5 | Shard 4 RS | M5_IP | 27140, 27141, 27142 |
| May 6 | Shard 5 RS | M6_IP | 27150, 27151, 27152 |

## 2) Chuan bi chung
- Tailscale tren ca 6 may
- MongoDB Community 7.x tren ca 6 may
- Node.js 20+ tren may 1

Kiem tra ket noi tu may 1:
```powershell
Test-NetConnection M2_IP -Port 27110
Test-NetConnection M3_IP -Port 27120
Test-NetConnection M4_IP -Port 27130
Test-NetConnection M5_IP -Port 27140
Test-NetConnection M6_IP -Port 27150
```

## 3) Cau hinh theo tung may

### 3.1 May 1 (controller)
```powershell
New-Item -ItemType Directory -Force C:\mongodb\mongos\log | Out-Null
New-NetFirewallRule -DisplayName "Mongo-mongos-27017" -Direction Inbound -Protocol TCP -LocalPort 27017 -Action Allow -ErrorAction SilentlyContinue
& "C:\Program Files\MongoDB\Server\7.0\bin\mongos.exe" --bind_ip 0.0.0.0 --port 27017 --logpath C:\mongodb\mongos\log\mongos.log --logappend
```

### 3.2 May 2 (Shard 1)
- Folder: `C:\mongodb\shard1\node1..3`
- replSetName: `shard1RS`
- Port: 27110/27111/27112

```javascript
rs.initiate({
  _id: "shard1RS",
  members: [
    { _id: 0, host: "M2_IP:27110" },
    { _id: 1, host: "M2_IP:27111" },
    { _id: 2, host: "M2_IP:27112" }
  ]
})
```

### 3.3 May 3 (Shard 2)
- Folder: `C:\mongodb\shard2\node1..3`
- replSetName: `shard2RS`
- Port: 27120/27121/27122

```javascript
rs.initiate({
  _id: "shard2RS",
  members: [
    { _id: 0, host: "M3_IP:27120" },
    { _id: 1, host: "M3_IP:27121" },
    { _id: 2, host: "M3_IP:27122" }
  ]
})
```

### 3.4 May 4 (Shard 3)
- Folder: `C:\mongodb\shard3\node1..3`
- replSetName: `shard3RS`
- Port: 27130/27131/27132

```javascript
rs.initiate({
  _id: "shard3RS",
  members: [
    { _id: 0, host: "M4_IP:27130" },
    { _id: 1, host: "M4_IP:27131" },
    { _id: 2, host: "M4_IP:27132" }
  ]
})
```

### 3.5 May 5 (Shard 4)
- Folder: `C:\mongodb\shard4\node1..3`
- replSetName: `shard4RS`
- Port: 27140/27141/27142

```javascript
rs.initiate({
  _id: "shard4RS",
  members: [
    { _id: 0, host: "M5_IP:27140" },
    { _id: 1, host: "M5_IP:27141" },
    { _id: 2, host: "M5_IP:27142" }
  ]
})
```

### 3.6 May 6 (Shard 5)
- Folder: `C:\mongodb\shard5\node1..3`
- replSetName: `shard5RS`
- Port: 27150/27151/27152

```javascript
rs.initiate({
  _id: "shard5RS",
  members: [
    { _id: 0, host: "M6_IP:27150" },
    { _id: 1, host: "M6_IP:27151" },
    { _id: 2, host: "M6_IP:27152" }
  ]
})
```

## 4) Dang ky shard vao mongos

```javascript
sh.addShard("shard1RS/M2_IP:27110,M2_IP:27111,M2_IP:27112")
sh.addShard("shard2RS/M3_IP:27120,M3_IP:27121,M3_IP:27122")
sh.addShard("shard3RS/M4_IP:27130,M4_IP:27131,M4_IP:27132")
sh.addShard("shard4RS/M5_IP:27140,M5_IP:27141,M5_IP:27142")
sh.addShard("shard5RS/M6_IP:27150,M6_IP:27151,M6_IP:27152")
sh.status()
```

## 5) Sharding strategy de demo

```javascript
sh.enableSharding("charity_distributed")
sh.shardCollection("charity_distributed.donations", { campaignCode: "hashed" })
```

## 6) Kiem thu

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/health"
Invoke-RestMethod -Uri "http://localhost:8080/api/stats/overview"
```

## 7) Tong ket

| May | Vai tro | Nhiem vu |
|---|---|---|
| May 1 | Controller | FE, BE, QA, mongos |
| May 2 | Shard 1 RS | 1 primary, 2 secondary |
| May 3 | Shard 2 RS | 1 primary, 2 secondary |
| May 4 | Shard 3 RS | 1 primary, 2 secondary |
| May 5 | Shard 4 RS | 1 primary, 2 secondary |
| May 6 | Shard 5 RS | 1 primary, 2 secondary |

## 8) Checklist
- [ ] May 1 chay FE + BE + QA + mongos
- [ ] May 2..6 moi may chay 1 replica set shard 3 node
- [ ] Da add du 5 shard vao mongos
- [ ] Du lieu phan bo theo shard key (campaignCode hashed)
- [ ] Topology phu hop mo hinh controller + 5 shard ngang hang
