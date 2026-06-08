"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { logout } from "@/lib/api";
import { useRouter } from "next/navigation";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, setUser } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setOpen(false);
    router.push("/");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md hover:bg-accent text-muted-foreground"
        aria-label="Toggle navigation menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-50">
          <a href="/send" className="block px-4 py-2 text-sm hover:bg-accent" onClick={() => setOpen(false)}>Send</a>
          <a href="/receive" className="block px-4 py-2 text-sm hover:bg-accent" onClick={() => setOpen(false)}>Retrieve</a>
          {user ? (
            <>
              <hr />
              <a href="/account" className="block px-4 py-2 text-sm hover:bg-accent" onClick={() => setOpen(false)}>Account</a>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm hover:bg-accent text-destructive">
                Log Out
              </button>
            </>
          ) : (
            <>
              <hr />
              <a href="/login" className="block px-4 py-2 text-sm hover:bg-accent" onClick={() => setOpen(false)}>Log In</a>
              <a href="/signup" className="block px-4 py-2 text-sm hover:bg-accent" onClick={() => setOpen(false)}>Sign Up</a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
