# Hướng dẫn chi tiết Backup, Restore và Failover MongoDB Replica Set

## 1. Backup MongoDB Replica Set

### 1.1. Backup toàn bộ dữ liệu (dùng mongodump)

- Chạy lệnh trên bất kỳ node nào (ưu tiên secondary):

```sh
# Backup toàn bộ database
mongodump --host mongo1 --port 27017 --out /backup/mongodump-$(date +%F-%H%M%S)
```

- Nếu muốn backup một database cụ thể:

```sh
mongodump --host mongo1 --port 27017 --db <ten_db> --out /backup/mongodump-$(date +%F-%H%M%S)
```

- Thư mục backup sẽ chứa các file .bson và .json.

### 1.2. Lưu ý

- Nên backup trên secondary để giảm tải primary.
- Thư mục /backup nên được mount ra ngoài container để lưu trữ lâu dài.

## 2. Restore MongoDB Replica Set

### 2.1. Khôi phục toàn bộ dữ liệu (dùng mongorestore)

- Dừng ghi dữ liệu mới vào cluster trong quá trình restore.
- Chạy lệnh trên bất kỳ node nào (ưu tiên secondary hoặc standalone):

```sh
# Restore toàn bộ database
mongorestore --host mongo1 --port 27017 /backup/mongodump-YYYY-MM-DD-HHMMSS
```

- Nếu chỉ restore một database:

```sh
mongorestore --host mongo1 --port 27017 --db <ten_db> /backup/mongodump-YYYY-MM-DD-HHMMSS/<ten_db>
```

### 2.2. Lưu ý

- Nếu restore vào cluster mới, cần khởi tạo replica set trước.
- Nếu restore từng phần, kiểm tra kỹ quyền và cấu trúc dữ liệu.

## 3. Kiểm tra và Thực hiện Failover

### 3.1. Kiểm tra trạng thái replica set

```sh
mongosh --host mongo1 --port 27017
rs.status()
```

- Xem trường `stateStr` để biết node nào là PRIMARY, SECONDARY.

### 3.2. Thực hiện failover thủ công

- Kết nối vào PRIMARY:

```sh
mongosh --host mongo1 --port 27017
```

- Hạ PRIMARY xuống để ép failover:

```js
rs.stepDown();
```

- Hoặc dừng container PRIMARY:

```sh
docker stop mongo1
```

- Kiểm tra lại rs.status() trên node khác để xác nhận failover.

### 3.3. Khôi phục node cũ

- Khởi động lại container:

```sh
docker start mongo1
```

- Node sẽ tự động join lại replica set.

## 4. Tham khảo

- Tài liệu chính thức: https://www.mongodb.com/docs/manual/administration/backup/
- Lệnh mongodump: https://www.mongodb.com/docs/database-tools/mongodump/
- Lệnh mongorestore: https://www.mongodb.com/docs/database-tools/mongorestore/
- Replica set failover: https://www.mongodb.com/docs/manual/replication/

---

**Lưu ý:**

- Luôn kiểm tra backup thành công trước khi restore.
- Nên kiểm tra trạng thái replica set sau mỗi thao tác backup/restore/failover.
- Đảm bảo quyền truy cập file backup khi restore.
