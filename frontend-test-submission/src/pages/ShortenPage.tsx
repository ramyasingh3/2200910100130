import React, { useMemo, useState } from "react";
import { createShortUrl } from "../api";

function Row({ onCreate }: { onCreate: (r: { shortLink: string; expiry: string }) => void }) {
  const [url, setUrl] = useState("");
  const [validity, setValidity] = useState<number | "">(30);
  const [shortcode, setShortcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const disabled = useMemo(() => {
    try { new URL(url); } catch { return true; }
    if (validity !== "" && (Number(validity) <= 0 || Number(validity) > 24*60)) return true;
    if (shortcode && !/^[a-z0-9]{4,10}$/.test(shortcode)) return true;
    return false;
  }, [url, validity, shortcode]);

  async function submit() {
    try {
      setLoading(true);
      setError(undefined);
      const body: any = { url };
      if (validity !== "") body.validity = Number(validity);
      if (shortcode) body.shortcode = shortcode;
      const res = await createShortUrl(body);
      onCreate(res);
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 160px 120px", gap: 8, marginBottom: 8 }}>
      <input placeholder="Original URL" value={url} onChange={(e) => setUrl(e.target.value)} />
      <input placeholder="Validity (min)" type="number" value={validity} onChange={(e) => setValidity(e.target.value === "" ? "" : Number(e.target.value))} />
      <input placeholder="Shortcode (optional)" value={shortcode} onChange={(e) => setShortcode(e.target.value)} />
      <button disabled={disabled||loading} onClick={submit}>{loading?"Creating...":"Create"}</button>
      {error && <div style={{ gridColumn: "1 / -1", color: "#b00020" }}>{error}</div>}
    </div>
  );
}

export default function ShortenPage() {
  const [results, setResults] = useState<Array<{ shortLink: string; expiry: string }>>([]);

  return (
    <div>
      <p>Shorten up to 5 URLs. Client-side validates URL, validity, shortcode.</p>
      {Array.from({ length: 5 }).map((_, i) => (
        <Row key={i} onCreate={(r) => setResults((prev) => [r, ...prev])} />
      ))}
      <div style={{ marginTop: 16 }}>
        {results.map((r, i) => (
          <div key={i} style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, marginBottom: 8 }}>
            <div><strong>Short:</strong> <a href={r.shortLink} target="_blank" rel="noreferrer">{r.shortLink}</a></div>
            <div><strong>Expiry:</strong> {r.expiry}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
