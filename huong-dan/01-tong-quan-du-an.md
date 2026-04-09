# 01 - Tong quan du an CSDLPT

## Muc tieu bai tap lon
Xay dung he thong quyen gop tu thien phan tan voi:
- Web frontend cho nguoi dung va admin
- Backend API xu ly giao dich quyen gop
- MongoDB Replica Set de dam bao tinh san sang
- Ket noi nhieu may bang Tailscale

## Thanh phan dung chung da duoc tao
- `apps/frontend`: giao dien React
- `apps/backend`: API Express + Mongoose
- `packages/shared`: kieu du lieu chia se
- `infrastructure/mongodb`: docker compose + script khoi tao replica set

## Luong du lieu
1. Nguoi dung tao donation tren frontend.
2. Frontend goi API `POST /api/donations`.
3. Backend validate input bang Zod.
4. Backend ghi du lieu vao MongoDB Replica Set.
5. Frontend tai lai danh sach donation tu `GET /api/donations`.

## Tieu chi dat cho mon hoc
- Co mo hinh CSDL phan tan (Replica Set)
- Co kịch ban failover co ban
- Co web hoat dong duoc
- Co phan chia cong viec ro rang theo thanh vien
