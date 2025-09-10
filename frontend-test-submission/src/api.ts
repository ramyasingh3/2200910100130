const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
export async function createShortUrl(input: { url: string; validity?: number; shortcode?: string }) {
  const res = await fetch(`${API_BASE}/shorturls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getStats(code: string) {
  const res = await fetch(`${API_BASE}/shorturls/${code}/stats`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
