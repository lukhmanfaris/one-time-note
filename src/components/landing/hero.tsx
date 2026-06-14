import Link from "next/link";

export function Hero() {
  return (
    <section className="section pt-40">
      <div className="max-w-content mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="max-w-lg">
            <div className="font-mono text-xs tracking-widest uppercase text-black/30 mb-6">
              Secret & Private Communication
            </div>

            <h1 className="font-ui text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Send secrets that <br />
              <span className="text-black/40">vanish forever</span>
            </h1>

            <p className="text-lg text-black/50 leading-relaxed mb-8">
              One Time Note lets you send encrypted messages that self-destruct after a single read. No traces, no history, no accounts required.
            </p>

            <div className="flex items-center gap-4 mb-8">
              <Link
                href="/send"
                className="btn-black rounded-2xl px-8 py-4 font-ui font-semibold text-sm tracking-wide transition-smooth inline-block"
              >
                Send a Note
              </Link>
              <Link
                href="#how-it-works"
                className="btn-outline rounded-2xl px-8 py-4 font-ui font-semibold text-sm tracking-wide transition-smooth inline-block"
              >
                How It Works
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 text-xs font-mono tracking-wider text-black/30">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
                <span>AES-256</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
                <span>Zero Logs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
                <span>One-Time Read</span>
              </div>
            </div>
          </div>

          {/* Right: Visual / Illustration */}
          <div className="relative">
            <div className="glass rounded-3xl p-8 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-black" />
                <span className="font-mono text-xs tracking-widest uppercase text-black/40">Encrypted Message</span>
              </div>
              <div className="space-y-3 mb-6">
                <div className="h-3 bg-black/5 rounded-full w-full" />
                <div className="h-3 bg-black/5 rounded-full w-4/5" />
                <div className="h-3 bg-black/5 rounded-full w-3/5" />
              </div>
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs tracking-wider text-black/30">
                  Expires in 24h
                </div>
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-black/40" />
                </div>
              </div>
            </div>

            {/* Floating key card */}
            <div className="glass rounded-2xl p-5 absolute -bottom-8 -left-8 w-48 z-20">
              <div className="font-mono text-xs tracking-widest uppercase text-black/40 mb-2">
                Share Link
              </div>
              <div className="font-mono text-lg tracking-widest font-semibold text-black">
                X7K9-M2P4
              </div>
            </div>

            {/* Decorative orb */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-black/5 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
