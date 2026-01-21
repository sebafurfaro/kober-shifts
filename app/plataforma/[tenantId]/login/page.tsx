"use client";

import { useState } from "react";
import { Button, Input, Card, CardBody } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.tenantId as string;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "Error");
        return;
      }
      router.push(`/plataforma/${tenantId}/panel`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/p-1.png')" }}>
      <div className="max-w-md w-full px-4">
        <Card className="py-8">
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4">
              <h2 className="text-2xl font-bold">Ingresar</h2>
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
                <p className="text-sm text-danger">{error}</p>
              ) : null}
              <Button type="submit" color="primary" isDisabled={loading} className="w-full">
                Entrar
              </Button>

              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="px-2 text-sm text-gray-500">O</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              <Button
                variant="bordered"
                onPress={() => window.location.href = `/api/plataforma/${tenantId}/auth/google`}
                isDisabled={loading}
                className="w-full"
              >
                Ingresar con Google
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}


