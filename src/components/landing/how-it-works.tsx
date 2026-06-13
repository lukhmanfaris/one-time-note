export function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Write",
      description: "Type your secret message in our encrypted text box. No character limits.",
    },
    {
      number: "2",
      title: "Encrypt",
      description: "We generate a unique key and encrypt your message with AES-256.",
    },
    {
      number: "3",
      title: "Vanish",
      description: "Recipient reads once. Message is permanently deleted from our servers.",
    },
  ];

  return (
    <section className="section" id="how-it-works">
      <div className="max-w-content mx-auto px-6">
        <div className="text-center mb-16">
          <div className="font-mono text-xs tracking-widest uppercase text-black/30 mb-4">
            Simple Process
          </div>
          <h2 className="font-ui text-4xl font-bold tracking-tight mb-4">
            Three steps to secure
          </h2>
          <p className="text-black/50 max-w-md mx-auto">
            No signup, no account, no hassle. Just write, encrypt, and share.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="glass glass-hover rounded-3xl p-8 transition-smooth text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center mx-auto mb-6">
                <span className="font-ui text-2xl font-bold text-black/30">{step.number}</span>
              </div>
              <h3 className="font-ui font-semibold text-lg mb-3">{step.title}</h3>
              <p className="text-sm text-black/50 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
