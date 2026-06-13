"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { logout } from "@/lib/api";

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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    router.push("/");
  };

  if (!user) {
    return (
      <a href="/login" className="text-sm text-muted-foreground hover:text-foreground">
        Log In
      </a>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="text-sm font-medium hover:text-foreground"
      >
        {user.email}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-50">
          <div className="px-4 py-2 text-xs text-muted-foreground">
            {user.tier === "pro" ? "Pro" : "Free"} plan
          </div>
          <hr />
          <a href="/account" className="block px-4 py-2 text-sm hover:bg-accent">Account</a>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent text-destructive"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}