"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { logout } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setOpen(false);
    router.push("/");
  };

  if (!user) {
    return (
      <Link
        href="/login"
        className="font-mono text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground transition-smooth px-4 py-2 rounded-lg"
      >
        Log In
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="font-mono text-xs tracking-wider text-muted-foreground hover:text-foreground transition-smooth px-4 py-2 rounded-lg hover:bg-muted"
      >
        {user.email}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-52 bg-background border border-border rounded-xl shadow-md z-50 overflow-hidden"
        >
          <div className="px-4 py-2.5 text-xs font-mono tracking-wider text-muted-foreground">
            {user.tier === "pro" ? "Pro" : "Free"} plan
          </div>
          <div className="h-px bg-border" />
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm hover:bg-muted transition-smooth"
          >
            Account
          </Link>
          <Button
            variant="ghost"
            size="sm"
            role="menuitem"
            onClick={handleLogout}
            className="w-full justify-start px-4 py-2.5 h-auto text-sm rounded-none text-destructive hover:text-destructive hover:bg-destructive/5"
          >
            Log Out
          </Button>
        </div>
      )}
    </div>
  );
}
