"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { LogOut, Plus } from "lucide-react";

export function StoreHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/store/auth/logout", { method: "POST" });
      router.push("/store/login");
    } catch {
      router.push("/store/login");
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between text-slate-800">
        <Link
          href="/store/tenants/metricas"
          className="font-semibold text-lg hover:opacity-80 transition-opacity"
        >
          Store Manager
        </Link>
        <nav className="flex items-center gap-2">
          <Button
            as={Link}
            href="/store/tenants?create=1"
            color="primary"
            size="sm"
            startContent={<Plus className="w-4 h-4" />}
          >
            Crear nuevo
          </Button>
          <Button as={Link} href="/store/tenants" variant="flat" size="sm">
            Tenants
          </Button>
          <Button
            color="danger"
            variant="flat"
            size="sm"
            onPress={handleLogout}
            startContent={<LogOut className="w-4 h-4" />}
          >
            Cerrar sesión
          </Button>
        </nav>
      </div>
    </header>
  );
}
