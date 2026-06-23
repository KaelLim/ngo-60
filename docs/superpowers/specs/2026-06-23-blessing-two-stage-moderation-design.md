# 祝福語兩階段審查（敏感詞 → AI）設計文件

- 日期：2026-06-23
- 狀態：設計確認中
- 範圍：祝福語送出流程的審查機制強化

## 背景與目標

目前祝福語送出 (`POST /api/blessing-tags`) 只有 Stage-2 的 AI（LLM Gateway, `Qwen3.6-35B-A3B`）審查。每次送出都呼叫 AI，明顯的髒話也照樣消耗 token。

目標：在 AI 之前加一層**免費、即時的敏感詞清單比對 (Stage 1)**。命中清單者直接擋下、不呼叫 AI；通過者才進 AI。並讓系統**自我學習**——AI 判定的不當字詞自動補進敏感詞清單，下次免 token 直接擋。

## 整體流程

```
使用者送出祝福
  → normalize(input)
  → Stage 1：input 是否包含 blocked_words 任一字詞？
       ├─ 是 → 422「包含不當字詞」（不呼叫 AI，0 token）
       └─ 否 → Stage 2：AI moderate()
                  ├─ ok      → INSERT 祝福 + 回傳成功
                  └─ not ok  → 422 + 觸發自我學習（見下）
```

## 資料模型（新增兩張表）

加入 `db/init.sql`（schema 需在所有環境建立；prod 啟動會重跑 init.sql，`CREATE TABLE` 對既有表報錯但不影響資料）。

```sql
CREATE TABLE blocked_words (
  id        SERIAL PRIMARY KEY,
  word      TEXT NOT NULL UNIQUE,          -- 已 normalize 後存入
  lang      VARCHAR(10) DEFAULT '',        -- 'zh' / 'en' ... 資訊用
  source    VARCHAR(10) DEFAULT 'manual',  -- 'seed' | 'manual' | 'ai'
  reviewed  BOOLEAN DEFAULT true           -- AI 自動加入者為 false（待審核）
);

CREATE TABLE allowed_words (
  id   SERIAL PRIMARY KEY,
  word TEXT NOT NULL UNIQUE                 -- 管理員確認「正常」的字詞，防止被 AI 重複加回
);
```

## Stage 1：敏感詞比對

- `normalize(text)`：轉小寫 → 去除空白與標點符號。
- 比對：對每個 blocked word 做 `normalizedInput.includes(word)`（子字串比對，可擋 `f u c k`、`幹!!!`）。
- **繁簡處理**：不引入轉換套件；seed 時將中文字詞的**繁體與簡體兩種寫法都存入**，維持 DB 可讀、無額外相依。
- **效能**：啟動時把 `blocked_words` 載入記憶體（Set/陣列）快取；任何新增／刪除後 `reloadCache()` 重新載入。每次送出僅做記憶體比對，不查 DB。

## Stage 2：AI 審查 + 自我學習

調整 `moderate()`：當判定不通過時，同時回傳**它認定的不當字詞**（只回「本質上即為髒話／侮辱／歧視」的獨立字詞，不回情境性詞語，降低誤擋）。

```
AI 不通過 → {ok:false, reason, badWords:["騙子","幹"]}
  對每個 badWord：
    在 allowed_words？
      ├─ 是 → 略過（不再加回，避免打地鼠）
      └─ 否 → INSERT blocked_words (source='ai', reviewed=false)  ← 立即生效、即時擋下
```

- AI 自動加入的字詞 **立即生效**（下次送出即在 Stage 1 被擋），但 `reviewed=false`，進入後台待審核佇列。
- 邊界：allowlist 只管「自動學習」，**不**強制放行整句。例：`死` 在 allowlist，使用者寫「去死啦」AI 仍可依語意擋下整句，只是不會再把 `死` 加進 blocklist。

## 管理員審核流程

後台檢視待審核（`reviewed=false`）字詞，二選一：
- **確實不當** → `reviewed=true`（保留於 blocked_words）。
- **其實正常** → 從 blocked_words 移除並寫入 allowed_words（之後 AI 不會再加回）。

## API（新增 `api/routes/blocked-words.ts`，沿用 `requireAdmin` JWT）

| Method | Path | 權限 | 用途 |
|---|---|---|---|
| GET | `/api/blocked-words/review` | admin | 待審核清單（`reviewed=false`）+ 總數 |
| PATCH | `/api/blocked-words/:id` | admin | 標記 `reviewed=true`（確實不當） |
| POST | `/api/blocked-words/:id/allow` | admin | 其實正常：移到 allowed_words |

Stage-1 比對與 AI 自動學習在現有 `POST /api/blessing-tags`（公開）內部完成，不額外開公開端點。

備註：不建「完整敏感詞列表」管理 UI（YAGNI）。seed 一次後，靠 AI 自動學習 + 待審核佇列維運。

## 後台 UI（祝福標籤管理頁）

1. **待審核容器**：在「設定 card（card-body）」與「標籤 table card」之間，新增一個 `<div class="card">`，列出待審核字詞與「確實不當／其實正常」按鈕。佇列為空時整個容器隱藏。
   - 容器頂端顯示說明文字，讓管理員了解這些字詞**現在已被視為敏感詞、已即時生效擋下**，且**若未審核會自動維持為敏感詞**。例如：
     > 「以下字詞由 AI 判定為不當，目前已列為敏感詞並即時生效。若未經審核，將自動維持為敏感詞；請確認要『保留』或標記為『正常』。」
2. **側邊欄紅點**：`祝福標籤管理` nav item 顯示待審核數量的紅色徽章，數量為 0 時隱藏；後台載入時與每次審核後更新。
3. 依 CLAUDE.md 規定，dashboard CSS/JS 變更需 +0.1 版本號。

## Seed（一次性）

獨立 seed 腳本（非寫入 init.sql，避免 prod 每次重啟重跑時 init.sql 過度膨脹），每個環境執行一次：
- 來源：**LDNOOBW**（`en` + `zh` + 常見語言，CC-BY 4.0，需標註出處）＋ 手動整理的**繁中 (zh_TW)** 字詞。
- 處理：normalize、去重、`source='seed'`、`reviewed=true`、`ON CONFLICT DO NOTHING` 批次寫入。
- **排除**：Tencent / Sensitive-lexicon / funNLP 等「政治敏感詞」清單（屬審查而非髒話，會誤擋正常祝福）。
- 資料在 volume 內持久化，seed 一次即可，init.sql 重跑不會清除。

## 錯誤處理與邊界

- Stage-1 命中 → `422 { ok:false, reason:"包含不當字詞，請修改後再送出" }`，**不回傳命中字詞**。前端已能顯示紅色 reason，無需改動。
- 記錄 log：`[審查] "text" → Stage1 擋下 (0.00s)`，以與 AI 擋下區分。
- Stage-1 快取載入失敗 → 略過 Stage 1，仍由 AI 把關（Stage-1 fail-open，Stage-2 才是最終守門）。
- AI 自動加入字詞失敗 → 記 log，但不影響回給使用者的審查結果。
- AI 服務異常 → 維持現行 fail-closed（不通過）。

## 測試

- 單元：`normalize()`、Stage-1 子字串比對（含繁簡、空白、標點、英文間隔）。
- 整合（Deno.test 對 `POST /api/blessing-tags`）：Stage-1 命中擋下且未呼叫 AI；通過 Stage-1 後 AI 通過→存入；AI 不通過→不存入且 badWords 寫入 blocked_words；badWord 在 allowlist 時略過；管理端點 require admin。

## 影響檔案（預估）

- `db/init.sql`：新增兩張表
- `api/routes/blessing-tags.ts`：Stage-1 比對、快取、AI 回傳 badWords、自動學習
- `api/routes/blocked-words.ts`（新）：審核端點
- `api/main.ts`：掛載新路由
- `web/public/dashboard/index.html` / `js/*` / `css/*`：待審核容器、側邊欄紅點、版本號 +0.1
- `scripts/seed-blocked-words.*`（新）：一次性 seed
- 前端送出元件：**無需改動**（已處理 422 reason）
