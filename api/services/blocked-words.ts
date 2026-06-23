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

// AI 學習到的不當字詞寫入清單。certain=true 直接標記已審核（免人工複審），
// certain=false 標記待審核（reviewed=false），進入後台待審核佇列。
export async function learnBadWords(
  words: { word: string; certain: boolean }[],
  lang = "",
): Promise<void> {
  for (const item of words) {
    const w = normalize(item.word);
    if (!w) continue;
    const allowed = await query("SELECT 1 FROM allowed_words WHERE word = $1", [w]);
    if (allowed.length > 0) continue;
    await query(
      "INSERT INTO blocked_words (word, lang, source, reviewed) VALUES ($1, $2, 'ai', $3) ON CONFLICT (word) DO NOTHING",
      [w, lang, item.certain === true],
    );
  }
  await loadBlockedWords();
}
