import { query } from "../db.ts";
import { normalize } from "../lib/text-normalize.ts";

// Source: https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words
// License: Creative Commons Attribution 4.0 International (CC BY 4.0)
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

const seen = new Set<string>();
for (const [lang, raw] of all) {
  const w = normalize(raw);
  if (!w || seen.has(w)) continue;
  seen.add(w);
  await query(
    "INSERT INTO blocked_words (word, lang, source, reviewed) VALUES ($1, $2, 'seed', true) ON CONFLICT (word) DO NOTHING",
    [w, lang],
  );
}
console.log(`[seed] processed ${all.length} entries, ${seen.size} unique normalized words inserted (ON CONFLICT skips existing)`);
Deno.exit(0);
