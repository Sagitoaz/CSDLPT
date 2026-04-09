# 02 - Cai dat moi truong cho moi may

## 1) Yeu cau phan cung toi thieu
- CPU: 2 cores
- RAM: 8GB
- SSD trong: 15GB
- Mang internet on dinh

## 2) Cai dat phan mem chung
### Windows
1. Cai Node.js LTS 20+: https://nodejs.org
2. Cai Git: https://git-scm.com/download/win
3. Cai Docker Desktop: https://www.docker.com/products/docker-desktop/
4. Cai MongoDB Compass (khuyen nghi): https://www.mongodb.com/products/tools/compass
5. Cai VS Code: https://code.visualstudio.com/

### Kiem tra nhanh
Mo PowerShell:
```powershell
node -v
npm -v
git --version
docker --version
```

Neu len version la dat.

## 3) Clone ma nguon
```powershell
git clone <URL_REPO_CUA_NHOM> charity-distributed
cd charity-distributed
```

## 4) Tao file moi truong
```powershell
Copy-Item .env.example .env
```

## 5) Cai dependencies cho monorepo
```powershell
npm install
```

## 6) Chay web (sau khi Mongo da san sang)
```powershell
npm run dev
```

Truy cap:
- Frontend: http://localhost:5173
- Backend health: http://localhost:8080/health
