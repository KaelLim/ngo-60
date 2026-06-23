# 祝福語兩階段審查（敏感詞 → AI）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a free, instant curse-word list check (Stage 1) in front of the existing AI moderation (Stage 2) for blessing submissions, with AI-learned words auto-added to the list for admin review.

**Architecture:** `POST /api/blessing-tags` first normalizes the text and checks it against an in-memory cache of `blocked_words` (Stage 1, 0 tokens). Only text that passes goes to the LLM (Stage 2). When the AI rejects, it returns the offending word(s), which are auto-inserted into `blocked_words` (`source='ai'`, `reviewed=false`) — blocking immediately, pending admin review in the dashboard. An `allowed_words` whitelist prevents re-blocking words an admin cleared.

**Tech Stack:** Deno + Hono (`api/`), PostgreSQL, vanilla-JS dashboard (`web/public/dashboard/`, not Vite-bundled), LLM Gateway (`Qwen3.6-35B-A3B`, OpenAI-compatible).

## Global Constraints

- Backend routes live in `api/routes/*.ts`, mounted in `api/main.ts`; DB access via `query<T>(sql, args)` from `api/db.ts`.
- Admin-only endpoints authenticate with `verifyToken(authHeader)` from `api/routes/auth.ts` and require `payload.role === "admin"`.
- LLM model is **`Qwen3.6-35B-A3B`** (env `LLM_MODEL` overrides). On AI/gateway error: **fail-closed** (reject). On Stage-1 cache-load error: **fail-open** (skip Stage 1, AI still gates).
- No new npm packages / no Tailwind. Traditional⇄Simplified handled by **seeding both variants**, not a runtime converter.
- Dashboard CSS/JS changes require bumping the version in `web/public/dashboard/index.html` (`css/styles.css?v=` and `js/main.js?v=`) by +0.1. **Current version: 1.5 → 1.6.**
- Stage-1 rejection reason must **not** echo the matched word.
- **DB is not reachable from the host** (compose `db` has no published port). Run DB checks via `docker compose exec db psql`. Run route checks against `http://localhost:8973` with **`curl` (Bash tool), never PowerShell `Invoke-RestMethod`** (it mangles UTF-8 Chinese bodies).
- Pure-logic unit tests run in a throwaway Deno container mounting local source (no rebuild): `docker run --rm -v "$(pwd)/api:/app" -w /app denoland/deno:latest test <file>`.

---

### Task 1: Database schema — `blocked_words` & `allowed_words`

**Files:**
- Modify: `db/init.sql` (append two `CREATE TABLE` blocks near the other table definitions)

**Interfaces:**
- Produces: tables `blocked_words(id, word UNIQUE, lang, source, reviewed)` and `allowed_words(id, word UNIQUE)`.

- [ ] **Step 1: Add the tables to `db/init.sql`**

Append these statements (anywhere after the existing `CREATE TABLE` section):

```sql
--
-- Name: blocked_words; Type: TABLE
--
CREATE TABLE IF NOT EXISTS public.blocked_words (
    id        SERIAL PRIMARY KEY,
    word      TEXT NOT NULL UNIQUE,
    lang      VARCHAR(10) DEFAULT '',
    source    VARCHAR(10) DEFAULT 'manual',
    reviewed  BOOLEAN DEFAULT true
);

--
-- Name: allowed_words; Type: TABLE
--
CREATE TABLE IF NOT EXISTS public.allowed_words (
    id   SERIAL PRIMARY KEY,
    word TEXT NOT NULL UNIQUE
);
```

- [ ] **Step 2: Apply to the running local DB**

Run:
```bash
docker compose exec -T db psql -U postgres events_app <<'SQL'
CREATE TABLE IF NOT EXISTS public.blocked_words (
    id SERIAL PRIMARY KEY, word TEXT NOT NULL UNIQUE,
    lang VARCHAR(10) DEFAULT '', source VARCHAR(10) DEFAULT 'manual',
    reviewed BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS public.allowed_words (
    id SERIAL PRIMARY KEY, word TEXT NOT NULL UNIQUE);
SQL
```

- [ ] **Step 3: Verify the tables exist**

Run: `docker compose exec db psql -U postgres events_app -c "\d blocked_words"`
Expected: shows columns `id, word, lang, source, reviewed`.

- [ ] **Step 4: Commit**

```bash
git add db/init.sql
git commit -m "feat: add blocked_words and allowed_words tables"
```

---

### Task 2: Text normalization + matcher (pure, TDD)

**Files:**
- Create: `api/lib/text-normalize.ts`
- Test: `api/lib/text-normalize.test.ts`

**Interfaces:**
- Produces:
  - `normalize(text: string): string` — lowercase, strip all whitespace/punctuation/symbols.
  - `findBlockedWord(normalizedText: string, words: string[]): string | null` — returns the first `words` entry that is a substring of `normalizedText`, else `null`. `words` are assumed already normalized.

- [ ] **Step 1: Write the failing test**

Create `api/lib/text-normalize.test.ts`:

```ts
import { assertEquals } from "jsr:@std/assert";
import { normalize, findBlockedWord } from "./text-normalize.ts";

Deno.test("normalize lowercases and strips spaces/punctuation", () => {
  assertEquals(normalize("F U C K!!!"), "fuck");
  assertEquals(normalize("幹 ！"), "幹");
  assertEquals(normalize("Hello, World."), "helloworld");
});

Deno.test("findBlockedWord finds a substring match", () => {
  assertEquals(findBlockedWord("我想說幹你娘", ["幹", "操"]), "幹");
});

Deno.test("findBlockedWord returns null when clean", () => {
  assertEquals(findBlockedWord("祝福慈濟平安喜樂", ["幹", "操"]), null);
});

Deno.test("findBlockedWord ignores empty words", () => {
  assertEquals(findBlockedWord("anything", ["", "x"]), null);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `docker run --rm -v "$(pwd)/api:/app" -w /app denoland/deno:latest test lib/text-normalize.test.ts`
Expected: FAIL — `Module not found .../text-normalize.ts`.

- [ ] **Step 3: Write the implementation**

Create `api/lib/text-normalize.ts`:

```ts
// Lowercase and remove all whitespace, punctuation, and symbols (Unicode-aware).
export function normalize(text: string): string {
  return text.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
}

// Returns the first word that appears as a substring of normalizedText, else null.
// `words` are assumed to be already normalized.
export function findBlockedWord(
  normalizedText: string,
  words: string[],
): string | null {
  for (const w of words) {
    if (w && normalizedText.includes(w)) return w;
  }
  return null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `docker run --rm -v "$(pwd)/api:/app" -w /app denoland/deno:latest test lib/text-normalize.test.ts`
Expected: PASS — 4 tests ok.

- [ ] **Step 5: Commit**

```bash
git add api/lib/text-normalize.ts api/lib/text-normalize.test.ts
git commit -m "feat: add text normalize + blocked-word matcher with tests"
```

---

### Task 3: Blocked-words service + Stage-1 in POST + admin bypass

**Files:**
- Create: `api/services/blocked-words.ts`
- Modify: `api/main.ts` (add startup cache load)
- Modify: `api/routes/blessing-tags.ts` (Stage-1 check + admin bypass in `POST /`)

**Interfaces:**
- Consumes: `normalize`, `findBlockedWord` (Task 2); `query` (`api/db.ts`); `verifyToken` (`api/routes/auth.ts`).
- Produces (from `api/services/blocked-words.ts`):
  - `loadBlockedWords(): Promise<void>` — loads all `blocked_words.word` into an in-memory cache.
  - `checkBlocked(rawText: string): string | null` — normalizes input, returns matched blocked word or null.
  - `learnBadWords(words: string[], lang?: string): Promise<void>` — for each word: normalize, skip if in `allowed_words`, else insert `(source='ai', reviewed=false)` ON CONFLICT DO NOTHING; then reload cache. (Used by Task 4.)

- [ ] **Step 1: Create the service**

Create `api/services/blocked-words.ts`:

```ts
import { query } from "../db.ts";
import { normalize, findBlockedWord } from "../lib/text-normalize.ts";

let cache: string[] = [];

export async function loadBlockedWords(): Promise<void> {
  const rows = await query<{ word: string }>("SELECT word FROM blocked_words");
  cache = rows.map((r) => r.word);
  console.log(`[敏感詞] 已載入 ${cache.length} 筆`);
}

export function checkBlocked(rawText: string): string | null {
  return findBlockedWord(normalize(rawText), cache);
}

export async function learnBadWords(words: string[], lang = ""): Promise<void> {
  for (const raw of words) {
    const w = normalize(raw);
    if (!w) continue;
    const allowed = await query("SELECT 1 FROM allowed_words WHERE word = $1", [w]);
    if (allowed.length > 0) continue;
    await query(
      "INSERT INTO blocked_words (word, lang, source, reviewed) VALUES ($1, $2, 'ai', false) ON CONFLICT (word) DO NOTHING",
      [w, lang],
    );
  }
  await loadBlockedWords();
}
```

- [ ] **Step 2: Load the cache at startup**

In `api/main.ts`, add the import after the other route imports (around line 17):

```ts
import { loadBlockedWords } from "./services/blocked-words.ts";
```

And immediately before `Deno.serve(...)` (line 62), add:

```ts
await loadBlockedWords();
```

- [ ] **Step 3: Add Stage-1 + admin bypass to the blessing POST**

In `api/routes/blessing-tags.ts`, add imports near the top (after the existing `import { query }` line):

```ts
import { verifyToken } from "./auth.ts";
import { checkBlocked, learnBadWords } from "../services/blocked-words.ts";
```

Then replace the body of `blessingTagRoutes.post("/", ...)` so the moderation runs only for non-admins. The handler becomes:

```ts
blessingTagRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const { message } = body;
  if (!message || !String(message).trim()) {
    return c.json({ error: "message is required" }, 400);
  }
  const text = String(message).trim();

  // 後台管理員（帶有效 admin token）直接略過審查
  const payload = await verifyToken(c.req.header("Authorization"));
  const isAdmin = !!payload && payload.role === "admin";

  if (!isAdmin) {
    // ── Stage 1: 敏感詞清單（免 token） ──
    const hit = checkBlocked(text);
    if (hit) {
      console.log(`[審查] "${text}" → Stage1 擋下 (0.00s)`);
      return c.json({ ok: false, reason: "包含不當字詞，請修改後再送出", elapsed: 0 }, 422);
    }

    // ── Stage 2: AI 審查 ──
    const start = Date.now();
    let verdict: Verdict;
    try {
      verdict = await moderate(text);
    } catch (e) {
      const secs = ((Date.now() - start) / 1000).toFixed(2);
      console.error(`[審查] "${text}" → 錯誤 (${secs}s): ${(e as Error).message}`);
      return c.json({ ok: false, reason: "審查服務暫時無法使用，請稍後再試", elapsed: Number(secs) }, 503);
    }
    const secs = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`[審查] "${text}" → ${verdict.ok ? "通過" : "未通過"} (${secs}s)` + (verdict.reason ? ` 原因:${verdict.reason}` : ""));

    if (!verdict.ok) {
      // (Task 4 will add auto-learn here)
      return c.json({ ok: false, reason: verdict.reason ?? "未通過審查", elapsed: Number(secs) }, 422);
    }
  }

  const rows = await query<BlessingTag>(
    `INSERT INTO blessing_tags (message) VALUES ($1) RETURNING *`,
    [text],
  );
  return c.json({ ok: true, tag: rows[0], elapsed: 0 }, 201);
});
```

- [ ] **Step 4: Rebuild and verify Stage-1 blocks a seeded word**

Run:
```bash
docker compose exec -T db psql -U postgres events_app -c "INSERT INTO blocked_words (word, source) VALUES ('幹', 'manual') ON CONFLICT DO NOTHING;"
docker compose up -d --build api
sleep 4
curl -s -X POST http://localhost:8973/api/blessing-tags -H 'Content-Type: application/json' --data '{"message":"幹你娘"}'
```
Expected: `{"ok":false,"reason":"包含不當字詞，請修改後再送出","elapsed":0}` and the api log shows `Stage1 擋下 (0.00s)`.

- [ ] **Step 5: Verify a clean wish still reaches the AI**

Run:
```bash
curl -s -X POST http://localhost:8973/api/blessing-tags -H 'Content-Type: application/json' --data '{"message":"祝福大家平安喜樂"}'
```
Expected: `{"ok":true,...}` (passed AI) — the wish is inserted.

- [ ] **Step 6: Commit**

```bash
git add api/services/blocked-words.ts api/main.ts api/routes/blessing-tags.ts
git commit -m "feat: stage-1 blocked-word check before AI moderation (admin bypass)"
```

---

### Task 4: AI returns offending words + auto-learn

**Files:**
- Modify: `api/routes/blessing-tags.ts` (`Verdict` type, `moderate()` prompt+parse, reject branch)

**Interfaces:**
- Consumes: `learnBadWords` (Task 3).
- Produces: `Verdict` now includes `badWords: string[]`; rejected wishes feed `learnBadWords`.

- [ ] **Step 1: Extend the `Verdict` type**

In `api/routes/blessing-tags.ts`, update the interface:

```ts
interface Verdict {
  ok: boolean;
  reason?: string;
  badWords?: string[];
}
```

- [ ] **Step 2: Ask the AI for the offending words**

Replace `MODERATION_SYSTEM_PROMPT` with:

```ts
const MODERATION_SYSTEM_PROMPT = `你是慈濟 60 週年活動網站的祝福語審查員。
以下任一情況判定不通過 (ok:false)：
1. 任何語言的髒話、詛咒、侮辱、仇恨、歧視字眼。
2. 對慈濟或其志工的攻擊、貶損、嘲諷或不實負面言論。
3. 廣告、垃圾訊息、政治宣傳、色情或暴力內容。
溫暖、正向、中性、祝福性質的內容判定通過 (ok:true)。
不通過時，於 badWords 陣列列出訊息中「本質上即屬髒話/侮辱/歧視的獨立字詞」
（例如「幹」「婊子」），不要列入需要上下文才算不當的一般詞語。
只輸出 JSON，不要其他文字：
{"ok":true} 或 {"ok":false,"reason":"簡短中文原因","badWords":["..."]}`;
```

- [ ] **Step 3: Parse `badWords` in `moderate()`**

In `moderate()`, replace the `try { const parsed = JSON.parse(cleaned); ... }` block with:

```ts
  try {
    const parsed = JSON.parse(cleaned);
    return {
      ok: parsed.ok === true,
      reason: parsed.reason,
      badWords: Array.isArray(parsed.badWords) ? parsed.badWords : [],
    };
  } catch {
    return { ok: false, reason: "審查結果無法解析" };
  }
```

- [ ] **Step 4: Auto-learn on AI rejection**

In the `POST /` handler (Task 3), replace the AI reject branch comment line with the learn call:

```ts
    if (!verdict.ok) {
      if (verdict.badWords && verdict.badWords.length > 0) {
        try {
          await learnBadWords(verdict.badWords);
        } catch (e) {
          console.error(`[敏感詞] 自動學習失敗: ${(e as Error).message}`);
        }
      }
      return c.json({ ok: false, reason: verdict.reason ?? "未通過審查", elapsed: Number(secs) }, 422);
    }
```

- [ ] **Step 5: Rebuild and verify auto-learn**

Run (uses a phrase the AI rejects with a clear bad word; confirm it gets learned):
```bash
docker compose up -d --build api
sleep 4
curl -s -X POST http://localhost:8973/api/blessing-tags -H 'Content-Type: application/json' --data '{"message":"去你的爛慈濟去死啦"}'
docker compose exec db psql -U postgres events_app -c "SELECT word, source, reviewed FROM blocked_words WHERE source='ai';"
```
Expected: first call returns `{"ok":false,...}`; the query shows one or more rows with `source=ai, reviewed=f`.

- [ ] **Step 6: Verify the learned word now blocks at Stage-1 (0 tokens)**

Run (resubmit a wish containing the just-learned word; pick one from the query output, e.g. assume it learned `去死`):
```bash
curl -s -X POST http://localhost:8973/api/blessing-tags -H 'Content-Type: application/json' --data '{"message":"叫你去死"}'
```
Expected: `{"ok":false,"reason":"包含不當字詞...","elapsed":0}` and log shows `Stage1 擋下 (0.00s)` (no AI call).

- [ ] **Step 7: Commit**

```bash
git add api/routes/blessing-tags.ts
git commit -m "feat: AI returns offending words; auto-add to blocked_words for review"
```

---

### Task 5: Admin review endpoints

**Files:**
- Create: `api/routes/blocked-words.ts`
- Modify: `api/main.ts` (mount route)

**Interfaces:**
- Consumes: `query`, `verifyToken`, `loadBlockedWords`.
- Produces HTTP endpoints (all require admin):
  - `GET /api/blocked-words/review` → `{ words: [{id, word, lang, source}], count }`
  - `PATCH /api/blocked-words/:id` → mark `reviewed=true`; returns `{ ok: true }`
  - `POST /api/blocked-words/:id/allow` → move word to `allowed_words`; returns `{ ok: true }`

- [ ] **Step 1: Create the route file**

Create `api/routes/blocked-words.ts`:

```ts
import { Hono } from "hono";
import { query } from "../db.ts";
import { verifyToken } from "./auth.ts";
import { loadBlockedWords } from "../services/blocked-words.ts";

export const blockedWordsRoutes = new Hono();

async function requireAdmin(c: any, next: any) {
  const payload = await verifyToken(c.req.header("Authorization"));
  if (!payload) return c.json({ error: "未授權" }, 401);
  if (payload.role !== "admin") return c.json({ error: "權限不足" }, 403);
  await next();
}
blockedWordsRoutes.use("/*", requireAdmin);

// 待審核清單 (AI 自動加入、尚未審核)
blockedWordsRoutes.get("/review", async (c) => {
  const words = await query(
    "SELECT id, word, lang, source FROM blocked_words WHERE reviewed = false ORDER BY id DESC",
  );
  return c.json({ words, count: words.length });
});

// 確實不當 → 標記已審核
blockedWordsRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  await query("UPDATE blocked_words SET reviewed = true WHERE id = $1", [id]);
  return c.json({ ok: true });
});

// 其實正常 → 移入白名單並從黑名單移除
blockedWordsRoutes.post("/:id/allow", async (c) => {
  const id = c.req.param("id");
  const rows = await query<{ word: string }>("SELECT word FROM blocked_words WHERE id = $1", [id]);
  if (rows.length === 0) return c.json({ error: "not found" }, 404);
  await query("INSERT INTO allowed_words (word) VALUES ($1) ON CONFLICT (word) DO NOTHING", [rows[0].word]);
  await query("DELETE FROM blocked_words WHERE id = $1", [id]);
  await loadBlockedWords();
  return c.json({ ok: true });
});
```

- [ ] **Step 2: Mount the route**

In `api/main.ts`, add the import near the other route imports:

```ts
import { blockedWordsRoutes } from "./routes/blocked-words.ts";
```

And mount it after the blessing-tags route (line 33):

```ts
app.route("/api/blocked-words", blockedWordsRoutes);
```

- [ ] **Step 3: Rebuild and verify the endpoints (with admin token)**

Run (login reads creds from your `.env` — replace USER/PASS):
```bash
docker compose up -d --build api
sleep 4
TOKEN=$(curl -s -X POST http://localhost:8973/api/auth/login -H 'Content-Type: application/json' --data '{"username":"<ADMIN_USER>","password":"<ADMIN_PASSWORD>"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')
curl -s http://localhost:8973/api/blocked-words/review -H "Authorization: Bearer $TOKEN"
```
Expected: JSON `{"words":[...],"count":N}` listing the `reviewed=false` words from Task 4.

- [ ] **Step 4: Verify "allow" moves a word and unblocks it**

Run (use a real id from the previous output; here `<ID>`):
```bash
curl -s -X POST http://localhost:8973/api/blocked-words/<ID>/allow -H "Authorization: Bearer $TOKEN"
docker compose exec db psql -U postgres events_app -c "SELECT * FROM allowed_words;"
```
Expected: `{"ok":true}`, and the word now appears in `allowed_words` (and is gone from `blocked_words`).

- [ ] **Step 5: Verify auth is enforced**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8973/api/blocked-words/review`
Expected: `401`.

- [ ] **Step 6: Commit**

```bash
git add api/routes/blocked-words.ts api/main.ts
git commit -m "feat: admin endpoints for reviewing AI-flagged blocked words"
```

---

### Task 6: One-time seed script (LDNOOBW + curated zh_TW)

**Files:**
- Create: `api/scripts/seed-blocked-words.ts`

**Interfaces:**
- Consumes: `query`, `normalize`. Inserts `source='seed', reviewed=true` rows.

- [ ] **Step 1: Create the seed script**

Create `api/scripts/seed-blocked-words.ts`:

```ts
import { query } from "../db.ts";
import { normalize } from "../lib/text-normalize.ts";

const LDNOOBW = "https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master";

// 手動整理的繁中常見髒話（明確不當，避免情境性詞語以免誤擋）
const ZH_TW = [
  "幹", "幹你娘", "幹妳娘", "操你媽", "靠北", "靠杯", "雞掰", "機掰",
  "婊子", "賤人", "賤貨", "去你媽的", "他媽的", "媽的", "三小", "白爛",
];

async function fetchList(lang: string): Promise<string[]> {
  try {
    const res = await fetch(`${LDNOOBW}/${lang}`);
    if (!res.ok) return [];
    return (await res.text()).split("\n").map((l) => l.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

const en = await fetchList("en");
const zh = await fetchList("zh");
const all = [...en.map((w) => ["en", w]), ...zh.map((w) => ["zh", w]), ...ZH_TW.map((w) => ["zh", w])];

let inserted = 0;
const seen = new Set<string>();
for (const [lang, raw] of all) {
  const w = normalize(raw);
  if (!w || seen.has(w)) continue;
  seen.add(w);
  await query(
    "INSERT INTO blocked_words (word, lang, source, reviewed) VALUES ($1, $2, 'seed', true) ON CONFLICT (word) DO NOTHING",
    [w, lang],
  );
  inserted++;
}
console.log(`[seed] processed ${all.length} entries, ${seen.size} unique normalized words`);
Deno.exit(0);
```

- [ ] **Step 2: Run the seed inside the api container**

Run (the script is baked into the image at `/app/scripts/`):
```bash
docker compose up -d --build api
sleep 4
docker compose exec api deno run --allow-net --allow-env scripts/seed-blocked-words.ts
```
Expected: log `[seed] processed N entries, M unique normalized words`.

- [ ] **Step 3: Verify the table is populated and reload the live cache**

Run:
```bash
docker compose exec db psql -U postgres events_app -c "SELECT count(*) FROM blocked_words WHERE source='seed';"
docker compose restart api
```
Expected: count is in the hundreds/thousands; after restart the api log shows `[敏感詞] 已載入 N 筆`.

- [ ] **Step 4: Commit**

```bash
git add api/scripts/seed-blocked-words.ts
git commit -m "feat: one-time seed script for blocked_words (LDNOOBW + zh_TW)"
```

---

### Task 7: Dashboard — 待審核 review queue + sidebar badge

**Files:**
- Modify: `web/public/dashboard/index.html` (review card between config & table cards; sidebar badge; version 1.5→1.6)
- Modify: `web/public/dashboard/js/api.js` (3 new methods)
- Modify: `web/public/dashboard/js/blessing-tags.js` (render queue, actions, badge)
- Modify: `web/public/dashboard/js/main.js` (set badge on load)
- Modify: `web/public/dashboard/css/styles.css` (badge styles)

**Interfaces:**
- Consumes: `GET /api/blocked-words/review`, `PATCH /api/blocked-words/:id`, `POST /api/blocked-words/:id/allow` (Task 5).

- [ ] **Step 1: Add API methods**

In `web/public/dashboard/js/api.js`, add inside the `api` object (e.g. after `createBlessingTag`):

```js
  async getReviewWords() {
    const res = await authFetch(`${API_BASE}/blocked-words/review`);
    return res.json();
  },
  async keepBlockedWord(id) {
    await authFetch(`${API_BASE}/blocked-words/${id}`, { method: 'PATCH' });
  },
  async allowBlockedWord(id) {
    await authFetch(`${API_BASE}/blocked-words/${id}/allow`, { method: 'POST' });
  },
```

- [ ] **Step 2: Add the review card to the markup**

In `web/public/dashboard/index.html`, between the config `</div>` that closes the `card` (line 314) and the table `<div class="card">` (line 315), insert:

```html
        <div class="card" id="review-words-card" style="margin-bottom: 20px; display: none;">
          <div class="card-body">
            <h3 style="margin-top:0;">敏感詞待審核 <span id="review-count-inline" style="color:#d9362b;"></span></h3>
            <p style="color:#666; font-size:14px;">以下字詞由 AI 判定為不當，目前已列為敏感詞並即時生效。若未經審核，將自動維持為敏感詞；請確認要「保留」或標記為「正常」。</p>
            <div class="table-container">
              <table>
                <thead><tr><th>字詞</th><th>語言</th><th>操作</th></tr></thead>
                <tbody id="review-words-table"></tbody>
              </table>
            </div>
          </div>
        </div>
```

- [ ] **Step 3: Add the sidebar badge**

In `web/public/dashboard/index.html`, change the blessing-tags nav item (lines 46–49) to include a badge span:

```html
        <div class="nav-item" data-section="blessing-tags">
          <span class="material-symbols-outlined">chat_bubble</span>
          <span>祝福標籤管理</span>
          <span id="review-nav-badge" class="nav-badge" style="display:none;"></span>
        </div>
```

- [ ] **Step 4: Bump the cache-bust version**

In `web/public/dashboard/index.html`, change `css/styles.css?v=1.5` → `?v=1.6` (line 10) and (find the bottom-of-file script tag) `js/main.js?v=1.5` → `?v=1.6`.

- [ ] **Step 5: Add badge CSS**

Append to `web/public/dashboard/css/styles.css`:

```css
.nav-badge {
  margin-left: auto;
  background: #d9362b;
  color: #fff;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}
```

- [ ] **Step 6: Render the queue + wire actions + badge**

In `web/public/dashboard/js/blessing-tags.js`, add these functions and call `loadReviewWords()` from `loadBlessingTags()`:

```js
export async function updateReviewBadge() {
  try {
    const { count } = await api.getReviewWords();
    const badge = document.getElementById('review-nav-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? '' : 'none';
    }
  } catch (e) { /* not admin / not logged in: ignore */ }
}

async function loadReviewWords() {
  const card = document.getElementById('review-words-card');
  const tbody = document.getElementById('review-words-table');
  if (!card || !tbody) return;
  try {
    const { words, count } = await api.getReviewWords();
    const badge = document.getElementById('review-nav-badge');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? '' : 'none'; }
    document.getElementById('review-count-inline').textContent = count > 0 ? `(${count})` : '';
    if (count === 0) { card.style.display = 'none'; return; }
    card.style.display = '';
    tbody.innerHTML = words.map(w => `
      <tr>
        <td>${w.word}</td>
        <td>${w.lang || ''}</td>
        <td class="actions">
          <button class="btn btn-danger btn-sm" data-action="keep" data-id="${w.id}">確實不當</button>
          <button class="btn btn-secondary btn-sm" data-action="allow" data-id="${w.id}">其實正常</button>
        </td>
      </tr>`).join('');
    tbody.querySelectorAll('[data-action="keep"]').forEach(b =>
      b.addEventListener('click', () => keepWord(parseInt(b.dataset.id))));
    tbody.querySelectorAll('[data-action="allow"]').forEach(b =>
      b.addEventListener('click', () => allowWord(parseInt(b.dataset.id))));
  } catch (e) { console.error('load review words failed', e); }
}

async function keepWord(id) {
  try { await api.keepBlockedWord(id); showToast('已保留為敏感詞'); loadReviewWords(); }
  catch { showToast('操作失敗', 'error'); }
}
async function allowWord(id) {
  try { await api.allowBlockedWord(id); showToast('已標記為正常'); loadReviewWords(); }
  catch { showToast('操作失敗', 'error'); }
}
```

In the existing `loadBlessingTags()`, add `loadReviewWords();` after `renderTagsTable();`:

```js
export async function loadBlessingTags() {
  try {
    tagsCache = await api.getBlessingTags();
    renderTagsTable();
    loadReviewWords();
    loadBlessingConfig();
  } catch (e) {
    console.error('Failed to load blessing tags:', e);
  }
}
```

- [ ] **Step 7: Set the badge on initial dashboard load**

In `web/public/dashboard/js/main.js`, change the blessing-tags import (line 8) to also import the badge updater, and call it during init:

```js
import { loadBlessingTags, initBlessingTags, openBlessingTagModal, closeBlessingTagModal, updateReviewBadge } from './blessing-tags.js';
```

Add `updateReviewBadge();` near the end of the `DOMContentLoaded` handler (after `loadHomepage();`):

```js
  loadHomepage();
  updateReviewBadge();
```

- [ ] **Step 8: Rebuild and verify in the browser**

Run: `docker compose up -d --build web` then hard-refresh `http://localhost:8973/dashboard/` (Ctrl+F5) and log in.
Expected:
- If there are `reviewed=false` words (from Task 4), a **red badge with the count** shows on 祝福標籤管理 in the sidebar.
- Opening 祝福標籤管理 shows the **待審核 card between the config form and the tags table**, with the explanatory text and 確實不當 / 其實正常 buttons.
- Clicking 確實不當 removes the row (badge decrements); 其實正常 removes it and (verify) adds it to `allowed_words`. When the queue empties, the card and badge disappear.

- [ ] **Step 9: Commit**

```bash
git add web/public/dashboard/index.html web/public/dashboard/js/api.js web/public/dashboard/js/blessing-tags.js web/public/dashboard/js/main.js web/public/dashboard/css/styles.css
git commit -m "feat: dashboard review queue for AI-flagged words + sidebar badge (dashboard v1.6)"
```

---

## Notes for the implementer

- **Order matters:** Task 2 → 3 → 4 share `api/routes/blessing-tags.ts` and the service; do them in sequence.
- **Prod deploy** (after merge): on the server `sudo docker compose up -d --build app` (git-pulls + rebuilds + applies `init.sql`'s new tables), then run the seed once inside the running container: `sudo docker compose exec app deno run --allow-net --allow-env scripts/seed-blocked-words.ts`. The `allowed_words`/`blocked_words` data persists in the volume across restarts.
- **Attribution:** LDNOOBW is CC-BY 4.0 — keep the source URL credited in the seed script (it is, in the constant).
- **Do NOT** seed political 敏感詞 lists (Tencent / Sensitive-lexicon / funNLP) — profanity only.
