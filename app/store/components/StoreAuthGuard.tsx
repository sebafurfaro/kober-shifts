"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function StoreAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isLoginPage = pathname === "/store/login";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (isLoginPage) {
      // Login page handles its own redirect if already logged in
      return;
    }

    // For other pages, check session via API
    // Add a small delay to avoid race condition with cookie setting after login
    const checkSession = async () => {
      // Small delay to ensure cookies are available after redirect
      await new Promise(resolve => setTimeout(resolve, 50));
      
      try {
        const res = await fetch("/api/store/tenants", {
          credentials: "include", // Important: include cookies
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.push("/store/login");
          }
        }
      } catch {
        router.push("/store/login");
      }
    };

    checkSession();
  }, [isLoginPage, router, mounted]);

  // Always render children to avoid hydration mismatch
  // The API check will redirect if needed
  return <>{children}</>;
}
