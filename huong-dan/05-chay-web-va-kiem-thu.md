# 05 - Chay web va kiem thu

## 1) Khoi dong backend + frontend
Tai thu muc goc:
```powershell
npm run dev
```

## 2) Kiem tra backend
Mo trinh duyet:
- `http://localhost:8080/health`

Ky vong:
```json
{"ok":true,"service":"charity-backend"}
```

## 3) Kiem tra frontend
Mo:
- `http://localhost:5173`

Nhap form donation va bam nut gui.

## 4) Kiem tra du lieu trong MongoDB
Dua vao mongosh:
```javascript
use charity_distributed
db.donations.find().sort({createdAt:-1}).limit(5)
```

## 5) Kich ban demo cho giang vien
1. Trinh bay kien truc tong quan.
2. Tao donation tu web.
3. Show document trong MongoDB.
4. Thuc hien failover PRIMARY.
5. Tao donation tiep va show he thong van ghi du lieu.

## 6) Loi thuong gap
- Loi ket noi Mongo: kiem tra MONGODB_URI, firewall, Tailscale ping.
- CORS loi: kiem tra CORS_ORIGIN trong `.env`.
- Frontend khong goi duoc API: kiem tra backend port 8080.
