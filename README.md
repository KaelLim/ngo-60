# NGO 60 週年活動網站

使用 Lit Web Components + Deno + PostgreSQL 建構的 NGO 60 週年活動網站。

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端框架 | Lit Web Components + TypeScript |
| 前端狀態 | @lit/context + Store pattern |
| 前端建置 | Vite (via Deno) |
| 後端運行時 | Deno |
| 後端框架 | Hono |
| 資料庫 | PostgreSQL 18 |
| 容器化 | Docker Compose |

## 專案結構

```
/
├── docker-compose.yml          # 開發環境 PostgreSQL
├── docker-compose.prod.yml     # 生產環境完整配置
├── db/
│   └── init.sql               # 資料庫 schema + 種子資料
├── api/                       # Deno + Hono 後端
│   ├── deno.json
│   ├── main.ts               # API 進入點
│   ├── db.ts                 # PostgreSQL 連線
│   ├── Dockerfile            # API 容器
│   └── routes/               # API 路由
│       ├── topics.ts
│       ├── events.ts
│       ├── blessings.ts
│       ├── impact.ts
│       ├── gallery.ts
│       └── homepage.ts
├── web/                       # Lit 前端
│   ├── deno.json
│   ├── vite.config.ts
│   ├── Dockerfile            # 前端容器
│   ├── public/
│   │   └── dashboard/        # 後台管理介面
│   └── src/
│       ├── main.ts
│       ├── services/api.ts
│       ├── stores/
│       ├── contexts/
│       └── components/
└── nginx/                     # Nginx 反向代理
    ├── nginx.conf
    └── Dockerfile
```

## 開發環境

### 前置需求

- [Deno](https://deno.land/) >= 1.40
- [Docker](https://www.docker.com/) (用於 PostgreSQL)

### 快速開始

```bash
# 1. Clone 專案
git clone https://github.com/KaelLim/ngo-60.git
cd ngo-60

# 2. 複製環境變數範本
cp .env.example .env

# 3. 一鍵啟動 (資料庫 + API + 前端)
deno task start
```

### 可用指令

| 指令 | 說明 |
|------|------|
| `deno task start` | 啟動全部 (DB + API + Web) |
| `deno task dev` | 同時啟動 API + Web |
| `deno task dev:api` | 只啟動 API (port 8000) |
| `deno task dev:web` | 只啟動前端 (port 5173) |
| `deno task db:up` | 啟動 PostgreSQL |
| `deno task db:down` | 停止 PostgreSQL |

### 開發端口

| 服務 | URL |
|------|-----|
| 前端 | http://localhost:5173 |
| API | http://localhost:8000 |
| 後台 | http://localhost:5173/dashboard/ |

## 生產環境部署

### Docker Compose 部署

```bash
# 1. 設定環境變數
cp .env.example .env
# 編輯 .env 設定資料庫密碼等

# 2. 建立並啟動所有服務
docker-compose -f docker-compose.prod.yml up -d --build

# 3. 查看服務狀態
docker-compose -f docker-compose.prod.yml ps
```

### 生產環境端口

| 服務 | URL |
|------|-----|
| 網站 | http://localhost (port 80) |
| 後台 | http://localhost/dashboard/ (需登入) |

### 後台登入

後台使用 Nginx Basic Auth 保護，預設帳密：
- 帳號：`admin`
- 密碼：`changeme`

修改密碼：
```bash
# 產生新的密碼雜湊
docker run --rm httpd:alpine htpasswd -nb admin your_new_password
# 將輸出貼到 nginx/nginx.conf 的 auth_basic_user_file 區塊
```

## API 端點

### 主題 (Topics)

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/topics` | 取得所有主題 |
| GET | `/api/topics/:id` | 取得單一主題 |
| POST | `/api/topics` | 新增主題 |
| PUT | `/api/topics/:id` | 更新主題 |
| DELETE | `/api/topics/:id` | 刪除主題 |

### 活動 (Events)

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/events?month=4&year=2026` | 取得特定月份活動 |
| GET | `/api/events/:id` | 取得單一活動 |
| POST | `/api/events` | 新增活動 |
| PUT | `/api/events/:id` | 更新活動 |
| DELETE | `/api/events/:id` | 刪除活動 |

### 祝福語 (Blessings)

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/blessings` | 取得所有祝福語 |
| GET | `/api/blessings?featured=true` | 取得精選祝福語 |
| POST | `/api/blessings` | 新增祝福語 |
| PUT | `/api/blessings/:id` | 更新祝福語 |
| DELETE | `/api/blessings/:id` | 刪除祝福語 |

### 影響力 (Impact)

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/impact` | 取得所有影響力區塊 |
| POST | `/api/impact` | 新增影響力區塊 |
| PUT | `/api/impact/:id` | 更新影響力區塊 |
| DELETE | `/api/impact/:id` | 刪除影響力區塊 |

### 圖庫 (Gallery)

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/gallery` | 取得所有圖片 |
| GET | `/api/gallery?category=homepage` | 依分類篩選圖片 |
| GET | `/api/gallery/random?count=15` | 隨機取得圖片 |
| POST | `/api/gallery` | 上傳圖片 (multipart/form-data) |
| PUT | `/api/gallery/:id` | 更新圖片分類 |
| DELETE | `/api/gallery/:id` | 刪除圖片 |

### 首頁 (Homepage)

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/homepage` | 取得首頁內容 |
| PUT | `/api/homepage` | 更新首頁內容 |

## 後台管理功能

Dashboard 提供以下管理功能：

- **首頁內容** - 編輯 Slogan、標題、內容
- **主題管理** - CRUD 主題，支援圖片選擇器
- **活動管理** - CRUD 活動，支援月份/年份篩選
- **祝福語管理** - CRUD 祝福語，支援精選標記
- **影響力管理** - CRUD 影響力統計區塊
- **圖庫管理** -
  - 上傳圖片並指定分類
  - 多選模式批次更新分類
  - 批次刪除圖片

### 圖片分類

| 分類 | 用途 |
|------|------|
| homepage | 首頁 60 Grid 圓形圖片 |
| events | 活動封面圖 |
| topics | 主題背景圖 |
| blessings | 祝福語配圖 |
| general | 一般圖片 |

## 授權

MIT License
