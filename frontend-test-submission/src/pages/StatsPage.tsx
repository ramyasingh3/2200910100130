import React, { useState } from "react";
import { getStats } from "../api";

export default function StatsPage() {
  const [code, setCode] = useState("");
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError(undefined);
      const res = await getStats(code.trim());
      setData(res);
    } catch (e: any) {
      setData(null);
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <input placeholder="Shortcode" value={code} onChange={(e)=>setCode(e.target.value)} />
        <button disabled={!/^[a-z0-9]{4,10}$/.test(code)} onClick={load}>{loading?"Loading...":"Fetch"}</button>
      </div>
      {error && <p style={{ color: "#b00020" }}>{error}</p>}
      {data && (
        <div style={{ marginTop: 16 }}>
          <div><strong>Original:</strong> {data.originalUrl}</div>
          <div><strong>Created:</strong> {data.createdAt}</div>
          <div><strong>Expiry:</strong> {data.expiry}</div>
          <div><strong>Total clicks:</strong> {data.totalClicks}</div>
          <h4>Clicks</h4>
          <ul>
            {data.clicks.map((c: any, i: number) => (
              <li key={i}>{c.timestamp} — referrer: {c.referrer||"-"} — ip: {c.ip||"-"}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
