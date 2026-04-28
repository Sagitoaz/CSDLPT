# FE Workspace (Frontend Only)

Frontend tach rieng cho he thong charity.

## Chuc nang
- Dashboard thong ke tong quan donations va campaigns
- Tao campaign moi
- Tao donation moi
- Loc donation theo status, campaign code, search text
- Duyet / Tu choi donation

## Yeu cau
- Backend dang chay o `http://localhost:8080`
- Neu backend va frontend nam tren 2 may khac nhau qua Tailscale, them origin FE vao `CORS_ORIGIN` o root `.env`
- FE dev port mac dinh la `5174`

## Cau hinh env
1. Copy `.env.example` thanh `.env`
2. Chinh gia tri:

```env
VITE_API_BASE=http://<TAILSCALE_BACKEND_IP>:8080/api
VITE_USE_MOCK=false
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
- Dam bao `fe/.env` tro toi `VITE_API_BASE=http://<TAILSCALE_BACKEND_IP>:8080/api`.
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
