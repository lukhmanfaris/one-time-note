import Link from "next/link";

export function Footer() {
  return (
    <footer className="section-sm border-t border-border">
      <div className="max-w-content mx-auto px-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <span className="text-background font-ui font-bold text-sm">N</span>
            </div>
            <span className="font-ui font-semibold text-sm tracking-tight">Revelio</span>
          </div>

          <div className="flex items-center gap-8 text-xs font-mono tracking-wider text-foreground/30">
            <Link href="/privacy" className="hover:text-foreground transition-smooth">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-smooth">Terms</Link>
            <Link href="/security" className="hover:text-foreground transition-smooth">Security</Link>
          </div>

          <span className="font-mono text-xs tracking-wider text-foreground/20">
            &copy; 2026
          </span>
        </div>
      </div>
    </footer>
  );
}
