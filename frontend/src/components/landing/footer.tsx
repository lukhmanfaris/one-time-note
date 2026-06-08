export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="max-w-[1100px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="text-lg font-bold mb-2">Revelio</div>
            <p className="text-sm text-muted-foreground">
              Self-destructing encrypted notes. Privacy by design.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Product</div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div><a href="/send" className="hover:text-foreground transition-colors">Send a Note</a></div>
              <div><a href="/receive" className="hover:text-foreground transition-colors">Retrieve a Note</a></div>
              <div><a href="/signup" className="hover:text-foreground transition-colors">Create Account</a></div>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Legal</div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div><span className="cursor-default">Privacy Policy</span></div>
              <div><span className="cursor-default">Terms of Service</span></div>
            </div>
          </div>
        </div>
        <div className="border-t pt-6 text-center text-xs text-muted-foreground">
          ENCRYPTED · EPHEMERAL · GONE
        </div>
      </div>
    </footer>
  );
}
