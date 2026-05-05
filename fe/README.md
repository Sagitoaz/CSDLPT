# FE Workspace (Frontend Only)

Frontend tach rieng cho he thong charity.

## Chuc nang
- Dashboard thong ke tong quan donations va campaigns
- Tao campaign moi
- Tao donation moi
- Loc donation theo status, campaign code, search text
- Duyet / Tu choi donation

## Yeu cau
- Backend dang chay o `http://localhost:8080` hoac Tailscale IP may 1 `http://100.105.34.84:8080`
- Da chay seed user demo neu muon dung backend that: `superadmin@charity.local / Demo@123`
- Neu backend va frontend nam tren 2 may khac nhau qua Tailscale, them origin FE vao `CORS_ORIGIN` o root `.env`
- FE dev port mac dinh la `5174`

## Cau hinh env
1. Copy `.env.example` thanh `.env`
2. Chinh gia tri:

```env
VITE_API_BASE=/api
VITE_BACKEND_ORIGIN=http://<TAILSCALE_BACKEND_IP>:8080
VITE_USE_MOCK=false
VITE_AUTH_EMAIL=superadmin@charity.local
VITE_AUTH_PASSWORD=Demo@123
VITE_DEFAULT_BRANCH_ID=660000000000000000000002
```

## Chay FE voi mock data (khong can BE)
- Dat `VITE_USE_MOCK=true` trong `.env`.
- Khi bat mock mode, FE dung du lieu gia lap trong bo nho va khong goi API backend.
- Cac thao tac tao campaign, tao donation, cap nhat status van hoat dong de test UI/flow.

## Chay local
```bash
npm install
npm run dev
```

App FE chay tai `http://localhost:5174`.

## Chay voi backend thuc
- Chay backend truoc.
- Dam bao `fe/.env` co `VITE_API_BASE=/api` va `VITE_BACKEND_ORIGIN=http://<TAILSCALE_BACKEND_IP>:8080`.
- Khi chay `npm run dev`, Vite proxy `/api` sang backend de tranh loi CORS khi mo bang localhost, Tailscale IP hoac LAN IP.
- FE tu dong login bang user demo trong `fe/.env`, sau do gan Bearer token vao cac request that.
- Dam bao root `.env` cho phep origin cua FE, vi du `CORS_ORIGIN=http://localhost:5174,http://<TAILSCALE_FE_IP>:5174`.

## Build production
```bash
npm run build
npm run preview
```

## Deploy static
Sau khi build, deploy thu muc `dist/` len Nginx, Netlify, Vercel, Cloudflare Pages, hoac static host bat ky.

Vi du Nginx:
- Copy toan bo file trong `dist/` vao root static
- Cau hinh fallback `try_files $uri /index.html;` cho SPA route
