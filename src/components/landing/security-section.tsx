export function SecuritySection() {
  return (
    <section className="section">
      <div className="max-w-content mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="font-mono text-xs tracking-widest uppercase text-foreground/30 mb-4">
              Security First
            </div>
            <h2 className="font-ui text-4xl font-bold tracking-tight mb-6">
              Military-grade encryption
            </h2>
            <p className="text-foreground/50 leading-relaxed mb-8">
              Your messages are protected with AES-256 encryption, the same standard used by governments and banks worldwide.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-foreground mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-ui font-semibold text-sm mb-1">End-to-End Encryption</h4>
                  <p className="text-sm text-foreground/50">Your message is encrypted before it leaves your device.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-foreground mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-ui font-semibold text-sm mb-1">Zero Knowledge</h4>
                  <p className="text-sm text-foreground/50">We can&apos;t read your messages. Ever.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-foreground mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-ui font-semibold text-sm mb-1">Auto-Destruct</h4>
                  <p className="text-sm text-foreground/50">Messages delete after one read or when TTL expires.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="glass rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="font-mono text-xs tracking-widest uppercase text-foreground/40">
                  Encryption Status
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-foreground" />
                  <span className="font-mono text-xs tracking-wider text-foreground/40">Active</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="font-mono text-xs tracking-wider text-foreground/40">Algorithm</span>
                  <span className="font-ui font-semibold text-sm">AES-256-GCM</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="font-mono text-xs tracking-wider text-foreground/40">Key Length</span>
                  <span className="font-ui font-semibold text-sm">256-bit</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="font-mono text-xs tracking-wider text-foreground/40">Storage</span>
                  <span className="font-ui font-semibold text-sm">Encrypted</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="font-mono text-xs tracking-wider text-foreground/40">Logs</span>
                  <span className="font-ui font-semibold text-sm">Zero</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
