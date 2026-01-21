"use client";

import { useState, useEffect } from "react";
import { Button, Input, Card, CardBody } from "@heroui/react";
import { useRouter } from "next/navigation";
import Logo from "../../branding/Logo";

export default function StoreLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/store/tenants");
        if (res.ok) {
          router.push("/store/tenants");
        }
      } catch {
        // Not logged in, stay on login page
      }
    };
    checkSession();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/store/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important: include cookies
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "Error al iniciar sesión");
        return;
      }
      // Wait a bit to ensure cookie is set before redirecting
      await new Promise(resolve => setTimeout(resolve, 100));
      // Use window.location instead of router.push to ensure full page reload
      // This ensures cookies are properly available
      window.location.href = "/store/tenants";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-nodo">
      <div className="max-w-md w-full px-4">
        <Card className="p-6">
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="w-full flex flex-col gap-2 justify-center items-center">
                <Logo width={80} height={85} />
                <h2 className="text-2xl font-bold text-center text-black">NODO <span className="bg-gradient-to-r from-[#1A237E] via-[#1497B5] to-[#26A69A] bg-clip-text text-transparent">App</span> </h2>
              </div>
              <p className="text-sm text-gray-500 text-center">Acceso restringido</p>
              <Input
                label="Email"
                type="email"
                value={email}
                onValueChange={setEmail}
                autoComplete="email"
                isRequired
              />
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onValueChange={setPassword}
                autoComplete="current-password"
                isRequired
              />
              {error ? (
                <p className="text-sm text-danger text-center">{error}</p>
              ) : null}
              <Button type="submit" isDisabled={loading} isLoading={loading} className="w-full button button-secondary">
                {loading ? "Iniciando sesión..." : "Entrar"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
