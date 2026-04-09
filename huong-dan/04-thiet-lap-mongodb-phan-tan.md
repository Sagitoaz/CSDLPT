# 04 - Thiet lap MongoDB Replica Set phan tan bang Tailscale

Tai lieu nay mo ta mo hinh 3 may vat ly/ao:
- May A chay mongo1
- May B chay mongo2
- May C chay mongo3

## 1) Cai MongoDB tren 3 may (neu khong dung Docker)
Tham khao: https://www.mongodb.com/docs/manual/installation/

Neu dung Docker, co the chay mongod container tren moi may voi cong 27017.

## 2) Tao file cau hinh mongod (tren moi may)
Noi dung mau:
```yaml
storage:
  dbPath: C:\data\mongo
net:
  port: 27017
  bindIp: 127.0.0.1,<TAILSCALE_IP_CUA_MAY>
replication:
  replSetName: rsCharity
security:
  authorization: enabled
```

## 3) Khoi dong mongod tren moi may
Vi du:
```powershell
mongod --config C:\path\mongod.conf
```

## 4) Khoi tao replica set tu May A
Mo `mongosh` tren May A:
```javascript
rs.initiate({
  _id: "rsCharity",
  members: [
    { _id: 0, host: "100.x.x.11:27017", priority: 2 },
    { _id: 1, host: "100.x.x.12:27017", priority: 1 },
    { _id: 2, host: "100.x.x.13:27017", priority: 1 }
  ]
})
```

## 5) Kiem tra trang thai
```javascript
rs.status()
rs.conf()
```
Can co 1 PRIMARY va 2 SECONDARY.

## 6) Tao user quan tri (bat buoc khi mo authorization)
```javascript
use admin
db.createUser({
  user: "charityAdmin",
  pwd: "<MAT_KHAU_MANH>",
  roles: [ { role: "root", db: "admin" } ]
})
```

## 7) Chuoi ket noi cho backend
Trong file `.env`:
```dotenv
MONGODB_URI=mongodb://charityAdmin:<MAT_KHAU_MANH>@100.x.x.11:27017,100.x.x.12:27017,100.x.x.13:27017/charity_distributed?replicaSet=rsCharity&authSource=admin
```

## 8) Test failover co ban
1. Dang co PRIMARY la May A.
2. Tat mongod tren May A.
3. Cho 10-20 giay.
4. Kiem tra `rs.status()` tren B/C: se co PRIMARY moi.
5. Goi API tao donation de xac nhan he thong tiep tuc hoat dong.
