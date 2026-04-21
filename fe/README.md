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
- CORS backend cho phep origin frontend (mac dinh backend dang dung 5173)

## Cau hinh env
1. Copy `.env.example` thanh `.env`
2. Chinh gia tri:

```env
VITE_API_BASE=http://localhost:8080/api
```

## Chay local
```bash
npm install
npm run dev
```

App FE chay tai `http://localhost:5174`.

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
