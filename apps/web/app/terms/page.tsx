import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <main className="legalPage">
      <article className="legalCard">
        <a className="legalBack" href="/">← Integrate</a>
        <span className="eyebrow">Early release</span>
        <h1>Product terms</h1>
        <p className="legalLead">These product terms describe the current Integrate early release. A final public launch should also receive appropriate legal review for the markets where it is offered.</p>
        <h2>Keep your own backup</h2>
        <p>Integrate is local-first. Browser storage can be cleared by the user, browser, operating system, or device-management tools. Export backups for important notes.</p>
        <h2>AI and math tools</h2>
        <p>AI, handwriting recognition, Math Assist, and graphing are learning aids and can be incomplete or incorrect. Verify important academic, financial, medical, legal, or safety-critical information with an appropriate trusted source.</p>
        <h2>Acceptable use</h2>
        <p>Do not use Integrate to violate applicable law, interfere with the service, attempt unauthorized access, or abuse shared AI capacity.</p>
        <h2>Early-release availability</h2>
        <p>Features can change as the product develops. Cloud accounts, collaboration, and cross-device sync are not part of this local-first release unless the app explicitly says otherwise.</p>
      </article>
    </main>
  );
}
