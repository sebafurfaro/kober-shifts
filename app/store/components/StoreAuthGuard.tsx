"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type AuthStatus = "pending" | "authenticated" | "unauthenticated";

export function StoreAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("pending");
  const isLoginPage = pathname === "/store/login";

  useEffect(() => {
    if (isLoginPage) {
      setAuthStatus("authenticated");
      return;
    }

    let cancelled = false;
    const checkSession = async () => {
      try {
        const res = await fetch("/api/store/tenants", {
          credentials: "include",
        });
        if (cancelled) return;
        if (res.ok) {
          setAuthStatus("authenticated");
        } else if (res.status === 401 || res.status === 403) {
          setAuthStatus("unauthenticated");
          router.replace("/store/login");
        } else {
          setAuthStatus("authenticated");
        }
      } catch {
        if (!cancelled) {
          setAuthStatus("unauthenticated");
          router.replace("/store/login");
        }
      }
    };

    checkSession();
    return () => { cancelled = true; };
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (authStatus === "pending" || authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-nodo flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
