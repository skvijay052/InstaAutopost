const features = [
  {
    title: "Scheduled posts",
    description: "Prepare captions and media, then publish through Meta's official API after configuration."
  },
  {
    title: "Comment replies",
    description: "Process comments on your own media with duplicate protection and response rules."
  },
  {
    title: "DM automation",
    description: "Handle eligible incoming messages while respecting Meta's messaging policies."
  }
];

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <div className="brand">◎ InstaAutopost</div>
        <span className="status"><span className="dot" /> Setup mode · Instagram disconnected</span>
      </header>

      <section className="hero">
        <div className="eyebrow">Instagram Business · Automation workspace</div>
        <h1>Your Instagram workflow, in one place.</h1>
        <p className="muted">
          A TypeScript and Vercel starter for scheduled publishing, comment management,
          eligible DM replies, and MCP-powered controls.
        </p>
      </section>

      <section className="grid" aria-label="Automation features">
        {features.map((feature) => (
          <article className="panel" key={feature.title}>
            <h2>{feature.title}</h2>
            <p className="muted">{feature.description}</p>
            <span className="status"><span className="dot" /> Not configured</span>
          </article>
        ))}
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Next setup steps</h2>
        <ol className="list">
          <li>Configure PostgreSQL and run the Prisma migration.</li>
          <li>Create a Meta developer app and authorize your Instagram Business account.</li>
          <li>Set up and verify Meta webhooks for comments and messages.</li>
          <li>Test API actions before enabling scheduled publishing or automatic replies.</li>
        </ol>
      </section>

      <p className="footer">
        Safe by default: no Instagram actions are sent until credentials, permissions, and automation rules are configured.
      </p>
    </main>
  );
}
