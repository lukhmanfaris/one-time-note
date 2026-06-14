export function UseCases() {
  const cases = [
    {
      number: "01",
      title: "Passwords",
      description: "Share credentials with colleagues without leaving a trail.",
    },
    {
      number: "02",
      title: "Private Links",
      description: "Send sensitive documents, URLs, or files via share links.",
    },
    {
      number: "03",
      title: "Personal Notes",
      description: "Share private information with friends or family.",
    },
    {
      number: "04",
      title: "2FA Codes",
      description: "Send backup codes or temporary access tokens.",
    },
  ];

  return (
    <section className="section">
      <div className="max-w-content mx-auto px-6">
        <div className="text-center mb-16">
          <div className="font-mono text-xs tracking-widest uppercase text-black/30 mb-4">
            Use Cases
          </div>
          <h2 className="font-ui text-4xl font-bold tracking-tight mb-4">
            Perfect for moments that matter
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {cases.map((caseItem) => (
            <div
              key={caseItem.number}
              className="glass glass-hover rounded-2xl p-6 transition-smooth"
            >
              <div className="font-mono text-xs tracking-wider text-black/30 mb-3">
                {caseItem.number}
              </div>
              <h4 className="font-ui font-semibold text-sm mb-2">{caseItem.title}</h4>
              <p className="text-xs text-black/50 leading-relaxed">{caseItem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
