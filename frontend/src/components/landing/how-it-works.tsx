export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Write",
      description: "Type your secret message. Select how long it should live.",
    },
    {
      number: "02",
      title: "Encrypt",
      description: "Your note is encrypted in your browser with AES-256-GCM. The server never sees plaintext.",
    },
    {
      number: "03",
      title: "Share",
      description: "Get a unique access key. Send it to your recipient. The note self-destructs after one read.",
    },
  ];

  return (
    <section className="max-w-[1100px] mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
      <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
        Three steps. Zero knowledge. One read.
      </p>
      <div className="flex flex-col md:flex-row gap-8 md:gap-12">
        {steps.map((step) => (
          <div key={step.number} className="flex-1 text-center md:text-left">
            <div className="text-5xl font-bold text-muted-foreground/20 mb-3">{step.number}</div>
            <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
