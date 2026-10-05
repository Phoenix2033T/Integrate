"use client";

import { useState } from "react";

type Result = {
  equivalent: boolean;
  confidence: string;
  reason: string;
};

type Props = {
  initialText?: string;
  onClose: () => void;
};

export default function MathAssist({ initialText = "", onClose }: Props) {
  const lines = initialText.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const [before, setBefore] = useState(lines[0] || "");
  const [after, setAfter] = useState(lines[1] || "");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function check() {
    if (!before.trim() || !after.trim()) return;
    setChecking(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/math/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ before, after })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not check this step.");
      setResult(payload as Result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not check this step.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <aside className="mathAssistPanel" aria-label="Math Assist">
      <div className="mathAssistHeader">
        <div><span>∑</span><div><strong>Math Assist</strong><small>Deterministic step check</small></div></div>
        <button onClick={onClose} aria-label="Close Math Assist">×</button>
      </div>
      <p>Compare two consecutive algebra steps. Integrate checks whether the transformation preserves the expression or equation.</p>
      <label>Previous step<textarea value={before} onChange={(event) => setBefore(event.target.value)} placeholder="2(x + 3) = 10" /></label>
      <label>Next step<textarea value={after} onChange={(event) => setAfter(event.target.value)} placeholder="2x + 6 = 10" /></label>
      <button className="primary mathCheckButton" onClick={() => void check()} disabled={checking || !before.trim() || !after.trim()}>{checking ? "Checking…" : "Check step"}</button>
      {result && <div className={result.equivalent ? "mathResult correct" : "mathResult incorrect"}><strong>{result.equivalent ? "✓ Step verified" : "! Check this step"}</strong><span>{result.reason}</span><small>{result.confidence} confidence</small></div>}
      {error && <div className="mathResult incorrect"><strong>Could not verify</strong><span>{error}</span></div>}
      <div className="mathAssistFootnote">This checker is intentionally conservative. An unverified step is not automatically wrong.</div>
    </aside>
  );
}
