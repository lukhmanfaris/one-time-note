import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="section pt-40">
      <div className="max-w-content mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="max-w-lg">
            <div className="font-mono text-xs tracking-widest uppercase text-foreground/30 mb-6">
              Secret & Private Communication
            </div>

            <h1 className="font-ui text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Send secrets that <br />
              <span className="text-foreground/40">vanish forever</span>
            </h1>

            <p className="text-lg text-foreground/50 leading-relaxed mb-8">
              One Time Note lets you send encrypted messages that self-destruct after a single read. No traces, no history, no accounts required.
            </p>

            <div className="flex items-center gap-4 mb-8">
              <Button
                render={<Link href="/send" />}
                size="cta"
                className="font-ui font-semibold text-sm tracking-wide"
              >
                Send a Note
              </Button>
              <Button
                render={<Link href="#how-it-works" />}
                variant="outline"
                size="cta"
                className="font-ui font-semibold text-sm tracking-wide"
              >
                How It Works
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 text-xs font-mono tracking-wider text-foreground/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                <span>AES-256</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                <span>Zero Logs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                <span>One-Time Read</span>
              </div>
            </div>
          </div>

          {/* Right: Visual / Illustration */}
          <div className="relative">
            <div className="glass rounded-3xl p-8 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-foreground" />
                <span className="font-mono text-xs tracking-widest uppercase text-foreground/40">Encrypted Message</span>
              </div>
              <div className="space-y-3 mb-6">
                <div className="h-3 bg-foreground/5 rounded-full w-full" />
                <div className="h-3 bg-foreground/5 rounded-full w-4/5" />
                <div className="h-3 bg-foreground/5 rounded-full w-3/5" />
              </div>
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs tracking-wider text-foreground/30">
                  Expires in 24h
                </div>
                <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-foreground/40" />
                </div>
              </div>
            </div>

            {/* Floating key card — hidden on small screens to prevent overflow */}
            <div className="hidden lg:block glass rounded-2xl p-5 absolute -bottom-8 -left-8 w-48 z-20">
              <div className="font-mono text-xs tracking-widest uppercase text-foreground/40 mb-2">
                Share Link
              </div>
              <div className="font-mono text-lg tracking-widest font-semibold text-foreground">
                X7K9-M2P4
              </div>
            </div>

            {/* Decorative orb */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-foreground/5 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
