// Per-browser record of blessings this visitor has already submitted, used to
// block the same person from spamming the same wish. Stored in localStorage so
// it never affects other visitors (different people can still post the same words).
const KEY = 'tzuchi60_sent_blessings';
const MAX_KEEP = 200;

function norm(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, '');
}

function getSent(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// True if this browser already submitted the same wish (ignoring case/spacing).
export function hasSentBlessing(text: string): boolean {
  const n = norm(text);
  return n !== '' && getSent().includes(n);
}

// Remember a successfully-submitted wish so it can't be re-sent from this browser.
export function recordSentBlessing(text: string): void {
  const n = norm(text);
  if (!n) return;
  const list = getSent();
  if (list.includes(n)) return;
  list.push(n);
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_KEEP)));
  } catch {
    /* storage full / disabled: ignore */
  }
}
