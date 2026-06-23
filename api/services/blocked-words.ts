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
