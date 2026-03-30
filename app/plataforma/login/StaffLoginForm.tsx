"use client";

import { useState } from "react";
import { Button, Input, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/app/branding/Logo";
import Link from "next/link";
import Script from "next/script";
import { Role } from "@/lib/types";
import { savePwaInstallTenantId } from "@/lib/pwa-entry";

export function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromInstalledPwa = searchParams.get("pwa") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let token = "";
      try {
        if (typeof window !== "undefined" && siteKey) {
          token = await new Promise<string>((resolve, reject) => {
            (window as unknown as { grecaptcha: { enterprise: { ready: (cb: () => void) => void } } }).grecaptcha.enterprise.ready(async () => {
              try {
                const resToken = await (
                  window as unknown as {
                    grecaptcha: { enterprise: { execute: (k: string, o: { action: string }) => Promise<string> } };
                  }
                ).grecaptcha.enterprise.execute(siteKey, { action: "LOGIN" });
                resolve(resToken);
              } catch (err) {
                reject(err);
              }
            });
          });
        }
      } catch (err) {
        console.error("Error al obtener token de reCAPTCHA:", err);
        setError("No se pudo conectar con reCAPTCHA. Desactivá tu bloqueador de anuncios y reintentá.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/plataforma/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, pwa: fromInstalledPwa, recaptchaToken: token }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "Error");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as {
        role?: Role;
        tenantId?: string;
      };
      const tenantId = data.tenantId;
      const role = data.role;
      if (!tenantId) {
        setError("Respuesta inválida del servidor");
        return;
      }
      savePwaInstallTenantId(tenantId);
      if (role === Role.ADMIN || role === Role.SUPERVISOR) {
        router.push(`/plataforma/${tenantId}/panel/admin`);
      } else if (role === Role.PROFESSIONAL) {
        router.push(`/plataforma/${tenantId}/panel/professional`);
      } else {
        router.push(`/plataforma/${tenantId}/panel`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {siteKey && <Script src={`https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`} />}
      <div
        className="flex justify-center items-center min-h-screen bg-white bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/p-1.png')" }}
      >
        <div className="max-w-md w-full px-4">
          <Card shadow="md" isBlurred className="bg-white/80">
            <CardHeader className="flex justify-center flex-col">
              <Logo width={50} height={50} />
              <h2 className="text-2xl font-semibold text-slate-800 font-primary">Ingresar al equipo</h2>
              {fromInstalledPwa ? (
                <p className="text-sm text-slate-500 font-normal text-center px-2">
                  Accedé con tu cuenta de la app instalada.
                </p>
              ) : null}
            </CardHeader>
            <Divider />
            <CardBody className="py-4 px-10">
              <p className="text-sm text-slate-600 mb-4 text-center">
                Si sos <span className="font-medium">paciente</span>, entrá desde el enlace de tu centro (cada clínica tiene su propia página de acceso).
              </p>
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
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                <Button type="submit" color="secondary" radius="none" size="lg" isDisabled={loading} className="w-full">
                  Entrar
                </Button>
              </form>
            </CardBody>
          </Card>
          <p className="text-center text-sm text-slate-500 mt-6">
            <Link href="/" className="text-primary underline">
              Volver al sitio público
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
