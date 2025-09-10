import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ShortenPage from "./pages/ShortenPage";
import StatsPage from "./pages/StatsPage";

function App() {
  return (
    <BrowserRouter>
      <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
        <header style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <h2 style={{ margin: 0, flex: 1 }}>URL Shortener</h2>
          <Link to="/">Shorten</Link>
          <Link to="/stats">Stats</Link>
        </header>
        <Routes>
          <Route path="/" element={<ShortenPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
