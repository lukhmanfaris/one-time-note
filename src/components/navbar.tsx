import Link from "next/link";
import { UserMenu } from "@/components/user-menu";

export function Navbar() {
  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <nav className="floating-nav rounded-2xl px-6 py-4 max-w-content mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
            <span className="text-white font-ui font-bold text-sm">N</span>
          </div>
          <span className="font-ui font-semibold text-sm tracking-tight">Revelio</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="font-mono text-xs tracking-wider uppercase text-black/40 hover:text-black transition-smooth px-4 py-2 rounded-lg"
          >
            Pricing
          </Link>
          <UserMenu />
          <Link
            href="/receive"
            className="btn-black rounded-xl px-5 py-2.5 font-mono text-xs tracking-wider uppercase transition-smooth"
          >
            Retrieve Note
          </Link>
        </div>
      </nav>
    </div>
  );
}
