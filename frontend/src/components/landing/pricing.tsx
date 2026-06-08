import Link from "next/link";

export function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "For occasional use",
      features: [
        "1-hour note TTL",
        "1 active note at a time",
        "End-to-end encryption",
        "No account required",
      ],
      cta: "Get Started",
      ctaHref: "/send",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$5",
      period: "/month",
      description: "For professionals",
      features: [
        "1h, 24h, or 7-day TTL",
        "Unlimited active notes",
        "End-to-end encryption",
        "Priority support",
      ],
      cta: "Upgrade to Pro",
      ctaHref: "/signup",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For teams and organizations",
      features: [
        "All Pro features",
        "API access",
        "Audit logs",
        "SSO integration",
      ],
      cta: "Contact Us",
      ctaHref: "mailto:hello@revelio.app",
      highlighted: false,
    },
  ];

  return (
    <section className="max-w-[1100px] mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Simple Pricing</h2>
      <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
        Start free. Upgrade when you need more.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`border rounded-lg p-6 flex flex-col ${
              tier.highlighted ? "border-foreground shadow-lg" : ""
            }`}
          >
            <h3 className="text-lg font-semibold">{tier.name}</h3>
            <div className="mt-2 mb-1">
              <span className="text-3xl font-bold">{tier.price}</span>
              <span className="text-sm text-muted-foreground">{tier.period}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>
            <ul className="space-y-2 mb-8 flex-1">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={tier.ctaHref}
              className={`block text-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                tier.highlighted
                  ? "bg-foreground text-background hover:opacity-90"
                  : "border hover:bg-accent"
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
