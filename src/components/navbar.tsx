"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <nav
        aria-label="Main navigation"
        className="floating-nav rounded-2xl px-6 py-4 max-w-content mx-auto"
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <span className="text-white font-ui font-bold text-sm">N</span>
            </div>
            <span className="font-ui font-semibold text-sm tracking-tight">Revelio</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/pricing"
              className="font-mono text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground transition-smooth px-4 py-2 rounded-lg"
            >
              Pricing
            </Link>
            <UserMenu />
            <Button
              render={<Link href="/receive" />}
              size="sm"
              className="font-mono text-xs tracking-wider uppercase"
            >
              Retrieve Note
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-smooth"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-border flex flex-col gap-1">
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="font-mono text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground transition-smooth px-3 py-2 rounded-lg hover:bg-muted"
            >
              Pricing
            </Link>
            <UserMenu />
            <Link
              href="/receive"
              onClick={() => setMobileOpen(false)}
              className="font-mono text-xs tracking-wider uppercase bg-foreground text-background px-3 py-2 rounded-lg text-center mt-1 hover:bg-foreground/90 transition-smooth"
            >
              Retrieve Note
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}
