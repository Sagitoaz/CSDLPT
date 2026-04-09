# 07 - Khung bao cao de xuat theo de bai CSDLPT

Tai lieu nay map yeu cau de bai vao du an "He thong quyen gop tu thien phan tan".

## 2.1 Dat van de
- Nhu cau va tam quan trong:
  - Nen tang tu thien can ghi nhan giao dich nhanh, khong mat du lieu.
  - Co nhieu diem truy cap (nhieu may, nhieu thanh vien).
- Ly do can CSDLPT:
  - Tang kha dung khi node loi.
  - Tang do tin cay du lieu nho replica set.
  - Ho tro truy cap lien diem qua Tailscale.
- Doi tuong su dung:
  - Nguoi quyen gop.
  - Admin kiem duyet.
  - Nhom van hanh/he thong.

## 2.2 Phan tich
### 2.2.1 Chuc nang chinh
- Tao donation.
- Xem danh sach donation.
- Cap nhat trang thai donation.
- Thong ke tong so tien theo chien dich.

### Tan suat truy cap (mau)
- Tao donation: cao vao khung gio cao diem.
- Xem danh sach: trung binh.
- Cap nhat status: thap-trung binh.
- Thong ke: theo dot bao cao.

### Phan quyen
- Donor: tao va xem thong tin ca nhan.
- Admin: duyet/tu choi donation, xem tong quan.
- Operator: theo doi health, failover, backup.

### Chuc nang theo node
- App node: xu ly API + UI.
- DB node: luu tru, replication, election.

### Phan tich CSDL
- Thuc the chinh: Donation, Campaign, User (admin/donor).
- Quan he chinh:
  - Campaign 1 - n Donation
  - User 1 - n Donation

## 2.2.2 Thiet ke
### Thiet ke CSDL logic
- Collection donations (da co trong backend scaffold)
- Collection campaigns (de mo rong)
- Collection users (de mo rong)

### Thiet ke CSDLPT
- Kieu phan tan: Replica Set 3 node (PRIMARY + 2 SECONDARY)
- Dinh vi:
  - Node A: PRIMARY uu tien cao
  - Node B: SECONDARY
  - Node C: SECONDARY
- Anh xa:
  - Ung dung ghi/ doc qua connection string replica set
  - MongoDB tu dong route den PRIMARY/SECONDARY theo role

### Kien truc he thong
- Mo hinh: Client/Server + distributed database
- Mang ket noi: Tailscale

## 3.2 Van hanh va kiem thu
- Kiem thu nhap du lieu: tao donation tu web
- Kiem thu hien thi: danh sach donation
- Kiem thu thong ke: tong so tien theo campaign
- Kiem thu dong bo/failover: tat PRIMARY, he thong van ghi tiep

## Danh sach artifact nhom can nop
1. Tai lieu phan tich-thiet ke theo cac muc tren.
2. Source code web (frontend + backend).
3. Script khoi tao MongoDB replica set.
4. Huong dan cai dat Tailscale + ket noi node.
5. Minh chung test failover + dong bo.
