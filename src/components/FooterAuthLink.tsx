"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "../lib/authStorage";

type RequiredRole = "user" | "admin";

export default function FooterAuthLink({
  href,
  requiredRole,
  children
}: {
  href: string;
  requiredRole: RequiredRole;
  children: ReactNode;
}) {
  const router = useRouter();

  function handleClick() {
    const session = getSession();

    if (session && session.role === requiredRole) {
      router.push(href);
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    window.dispatchEvent(
      new CustomEvent("lune-open-auth", {
        detail: {
          role: requiredRole,
          view: "login",
          redirectTo: href
        }
      })
    );
  }

  return (
    <button type="button" className="footer-auth-link" onClick={handleClick}>
      {children}
    </button>
  );
}