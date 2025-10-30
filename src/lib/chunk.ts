export function chunkText(s: string, max = 1200): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += max):
    out.push(s.slice(i, i + max));
  return out;
}