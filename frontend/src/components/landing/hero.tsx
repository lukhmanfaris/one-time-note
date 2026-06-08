import Link from "next/link";

export function Hero() {
  return (
    <section className="max-w-[1100px] mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
      <h1 className="text-5xl md:text-7xl lg:text-[88px] font-bold tracking-tight leading-tight mb-6 opacity-0 animate-fade-in-up">
        Revelio
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto opacity-0 animate-fade-in-up animation-delay-100">
        Send secrets that <span className="text-destructive font-semibold">self-destruct</span> after one read.
      </p>
      <p className="text-muted-foreground mb-10 max-w-xl mx-auto opacity-0 animate-fade-in-up animation-delay-200">
        End-to-end encrypted notes. No accounts required. No logs.
        Your message exists once, then vanishes forever.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4 opacity-0 animate-fade-in-up animation-delay-300">
        <Link
          href="/send"
          className="inline-flex items-center justify-center rounded-md bg-foreground text-background px-8 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Send a Note
        </Link>
        <Link
          href="/receive"
          className="inline-flex items-center justify-center rounded-md border px-8 py-3 text-sm font-medium hover:bg-accent transition-colors"
        >
          Retrieve a Note
        </Link>
      </div>
    </section>
  );
}
