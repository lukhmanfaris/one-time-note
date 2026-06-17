import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "Forever free",
      features: [
        "10 notes/month",
        "24h max expiry",
        "Basic encryption",
      ],
      cta: "Get Started",
      ctaHref: "/send",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$5",
      period: "per month",
      features: [
        "Unlimited notes",
        "7 day max expiry",
        "Priority support",
        "Custom keys",
      ],
      cta: "Upgrade to Pro",
      ctaHref: "/signup",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "For teams",
      features: [
        "Everything in Pro",
        "Custom expiry",
        "API access",
        "SSO & audit logs",
      ],
      cta: "Contact Sales",
      ctaHref: "mailto:hello@onetime.note",
      highlighted: false,
    },
  ];

  return (
    <section className="section">
      <div className="max-w-content mx-auto px-6">
        <div className="text-center mb-16">
          <div className="font-mono text-xs tracking-widest uppercase text-foreground/30 mb-4">
            Pricing
          </div>
          <h2 className="font-ui text-4xl font-bold tracking-tight mb-4">
            Simple and transparent
          </h2>
          <p className="text-foreground/50 max-w-md mx-auto">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-narrow mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`glass rounded-3xl p-8 relative ${
                tier.highlighted ? "border-2 border-foreground/10" : ""
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="font-mono tracking-wider">POPULAR</Badge>
                </div>
              )}
              <div className="font-mono text-xs tracking-widest uppercase text-foreground/40 mb-4">
                {tier.name}
              </div>
              <div className="font-ui text-4xl font-bold mb-2">{tier.price}</div>
              <p className="text-sm text-foreground/50 mb-6">{tier.period}</p>
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-foreground/60">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                render={<Link href={tier.ctaHref} />}
                variant={tier.highlighted ? "default" : "outline"}
                className="w-full font-ui font-semibold text-sm tracking-wide justify-center"
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
