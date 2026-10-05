"use client";

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="systemPage">
      <section className="systemCard">
        <div className="systemMark">∫</div>
        <span className="eyebrow">Integrate</span>
        <h1>Something went wrong.</h1>
        <p>Your notes are stored locally on this device. Try reopening the workspace before making any other changes.</p>
        <div className="systemActions">
          <button className="primary" onClick={reset}>Try again</button>
          <button className="subtleButton" onClick={() => window.location.assign("/")}>Return to Integrate</button>
        </div>
      </section>
    </main>
  );
}
