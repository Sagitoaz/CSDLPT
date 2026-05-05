# Huong dan setup va chay FE

Tai lieu nay dung cho frontend trong thu muc fe.

## 1. Dieu kien can

- Da cai Node.js ban LTS (khuyen nghi >= 18)
- Co npm
- Dang dung terminal tai thu muc fe

## 2. Cai dependency

Chay lenh:

```bash
npm install
```

## 3. Cau hinh bien moi truong

### B1: Tao file .env

Co the copy tu file mau:

```bash
copy .env.example .env
```

Neu lenh copy khong hoat dong trong shell hien tai, tao file .env thu cong.

### B2: Noi dung .env

```env
VITE_API_BASE=/api
VITE_BACKEND_ORIGIN=http://100.105.34.84:8080
VITE_USE_MOCK=false
VITE_AUTH_EMAIL=superadmin@charity.local
VITE_AUTH_PASSWORD=Demo@123
VITE_DEFAULT_BRANCH_ID=660000000000000000000002
```

## 4. Chay FE o che do development

```bash
npm run dev
```

Mac dinh FE chay o:

- http://localhost:5174
- http://100.105.34.84:5174

## 5. Build FE production

```bash
npm run build
```

Sau khi build xong, output nam trong thu muc:

- dist/

## 6. Preview ban production tai local

```bash
npm run preview
```

Mac dinh preview o:

- http://localhost:4174

## 7. Luu y quan trong

- FE chi la giao dien, can backend dang chay de lay/ghi du lieu MongoDB that.
- Khi `VITE_USE_MOCK=false`, FE tu dong login user demo va gui JWT Bearer token cho backend.
- Neu bi loi CORS, backend can cho phep origin cua FE (http://localhost:5174).
- Neu backend chay cong khac, cap nhat lai VITE_BACKEND_ORIGIN trong .env.
- Khi chay dev, FE goi `/api` cung origin va Vite se proxy sang backend, nen tranh duoc loi CORS khi mo bang IP khac nhau.

## 8. Quy trinh nhanh

1. npm install
2. copy .env.example .env
3. npm run dev
4. Mo http://localhost:5174
