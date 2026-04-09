# 03 - Thiet lap mang ao Tailscale cho 6 may

Muc tieu: 6 thanh vien ket noi vao cung 1 tailnet de truy cap MongoDB node cua nhau.

## 1) Tao tai khoan va tailnet
1. 1 ban truong nhom tao tailnet tai https://tailscale.com
2. Moi 5 thanh vien con lai bang email.
3. Xac nhan tat ca deu nhin thay nhau trong trang Machines.

## 2) Cai Tailscale tren tung may
- Tai: https://tailscale.com/download
- Dang nhap bang tai khoan da duoc moi.

## 3) Lay dia chi Tailscale IP
Tren moi may:
```powershell
tailscale ip -4
```
Ghi lai bang mapping:
- Node A (mongo1): 100.x.x.11
- Node B (mongo2): 100.x.x.12
- Node C (mongo3): 100.x.x.13
- May frontend/backend: 100.x.x.21, ...

## 4) Bat ket noi noi bo
Tren dashboard Tailscale, bat:
- MagicDNS: ON
- ACL mac dinh noi bo (chi nhom)

## 5) Kiem tra ket noi lien may
Tu may A ping may B:
```powershell
ping 100.x.x.12
```
Tu may A ping may C:
```powershell
ping 100.x.x.13
```
Neu ping duoc la dat.

## 6) Quy uoc bao mat
- Khong public cong MongoDB ra internet.
- Chi mo cong trong mang Tailscale.
- Dung user/password cho Mongo o moi truong demo chinh thuc.
