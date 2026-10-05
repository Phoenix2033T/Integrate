import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main className="legalPage">
      <article className="legalCard">
        <a className="legalBack" href="/">← Integrate</a>
        <span className="eyebrow">Release privacy notice</span>
        <h1>Privacy</h1>
        <p className="legalLead">Integrate is designed as a local-first notebook. This notice describes the behavior of the current web release.</p>
        <h2>Notes and files</h2>
        <p>Your notebook workspace is stored in your browser on the device you use. Audio recordings are stored in the browser&apos;s local IndexedDB storage. Integrate does not currently require an account or automatically upload your notebook library to an Integrate cloud database.</p>
        <h2>AI features</h2>
        <p>AI features are optional. When you intentionally use an AI or handwriting-recognition action, the note context or image needed for that request is sent to the configured server-side AI provider for processing. Do not submit information you do not want processed by that service.</p>
        <h2>Microphone</h2>
        <p>Integrate requests microphone permission only when you start an audio recording. Recordings remain local to the browser in the current release unless you export or otherwise share them yourself.</p>
        <h2>Backups and deletion</h2>
        <p>You can export a JSON workspace backup. Clearing browser site data can permanently remove local notes and recordings, so keep backups of important work. Moving a notebook to Trash does not remove it until it is permanently deleted.</p>
        <h2>Changes</h2>
        <p>This notice will be updated before any release that materially changes how Integrate stores or transmits user data.</p>
      </article>
    </main>
  );
}
