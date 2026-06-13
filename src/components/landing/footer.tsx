export function Footer() {
  return (
    <footer className="section-sm border-t border-black/5">
      <div className="max-w-content mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <span className="text-white font-ui font-bold text-sm">N</span>
            </div>
            <span className="font-ui font-semibold text-sm tracking-tight">Note</span>
          </div>

          <div className="flex items-center gap-8 text-xs font-mono tracking-wider text-black/30">
            <a href="#" className="hover:text-black transition-smooth">Privacy</a>
            <a href="#" className="hover:text-black transition-smooth">Terms</a>
            <a href="#" className="hover:text-black transition-smooth">Security</a>
          </div>

          <span className="font-mono text-xs tracking-wider text-black/20">
            &copy; 2026
          </span>
        </div>
      </div>
    </footer>
  );
}
