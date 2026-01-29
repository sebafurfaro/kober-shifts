"use client";

import { useState } from "react";
import { Button, Input, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import Logo from "@/app/branding/Logo";
import { GoogleIcon } from "@/app/branding/GoogleIcon";

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
    <div className="flex justify-center items-center min-h-screen bg-white bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/p-1.png')" }}>
      <div className="max-w-md w-full px-4">
        <Card shadow="md" isBlurred className="bg-white/80">
          <CardHeader className="flex justify-center flex-col">
            <Logo width={50} height={50} />
            <h2 className="text-2xl font-semibold text-slate-800 font-primary">Ingresar</h2>
          </CardHeader>
          <Divider />
          <CardBody className="py-4 px-10">
            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onValueChange={setEmail}
                autoComplete="email"
                variant="underlined"
                isRequired
                classNames={{
                  input: "text-slate-800",
                  inputWrapper: "text-slate-800",
                }}
              />
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onValueChange={setPassword}
                autoComplete="current-password"
                variant="underlined"
                isRequired
                classNames={{
                  input: "text-slate-800",
                  inputWrapper: "text-slate-800",
                }}
              />
              {error ? (
                <p className="text-sm text-danger">{error}</p>
              ) : null}
              <Button type="submit" color="secondary" radius="none" size="lg" isDisabled={loading} className="w-full">
                Entrar
              </Button>

              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="px-2 text-sm text-gray-500">O</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              <Button
                variant="flat"
                onPress={() => window.location.href = `/api/plataforma/${tenantId}/auth/google`}
                isDisabled={loading}
                className="w-full bg-white text-black hover:bg-gray-100"
                radius="none"
              >
                <GoogleIcon />
                Ingresar con Google
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}


