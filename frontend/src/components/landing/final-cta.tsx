import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="max-w-[1100px] mx-auto px-4 py-20 text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        Ready to Send a Secret?
      </h2>
      <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
        No signup required. Encrypt a note in seconds. Share the key. Done.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
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
