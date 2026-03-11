"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { Button, Input, Card, CardBody, Divider } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "../../branding/Logo";
import { GoogleIcon } from "../../branding/GoogleIcon";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Tu correo no tiene acceso al store. Solo se permiten cuentas autorizadas.",
  no_code: "No se recibió el código de autorización.",
  no_id_token: "Google no devolvió los datos esperados.",
  no_email: "No se pudo obtener el correo de la cuenta.",
  auth_failed: "Error al iniciar sesión con Google. Intentá de nuevo.",
  config: "Error de configuración. Revisá la consola.",
};

const REDIRECT_URI_HELP_URL = "/api/store/auth/google/redirect-uri";

function StoreLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const urlError = useMemo(() => {
    const err = searchParams.get("error");
    return err ? ERROR_MESSAGES[err] ?? "Error al iniciar sesión" : null;
  }, [searchParams]);

  useEffect(() => {
    setError(urlError);
  }, [urlError]);

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
        <Card className="p-6" aria-label="Formulario de inicio de sesión">
          <CardBody>
            <div className="w-full flex flex-col gap-2 justify-center items-center mb-4">
              <Logo width={80} height={85} />
              <h2 className="text-2xl font-bold text-center text-black">NODO <span className="bg-linear-to-r from-[#1A237E] via-[#1497B5] to-[#26A69A] bg-clip-text text-transparent">App</span> </h2>
            </div>
            <p className="text-sm text-gray-500 text-center mb-4">Acceso restringido</p>

            <Button
              type="button"
              onPress={() => (window.location.href = "/api/store/auth/google")}
              className="w-full mb-4"
              variant="bordered"
              startContent={<GoogleIcon width={20} height={20} />}
              aria-label="Ingresar con Google"
            >
              Ingresar con Google
            </Button>

            <Divider className="my-2" />

            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onValueChange={setEmail}
                autoComplete="email"
                aria-label="Email"
              />
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onValueChange={setPassword}
                autoComplete="current-password"
                aria-label="Contraseña"
              />
              {(error ?? urlError) ? (
                <div className="space-y-2">
                  <p className="text-sm text-danger text-center">{error ?? urlError}</p>
                  <p className="text-xs text-center text-gray-500">
                    Si ves <strong>redirect_uri_mismatch</strong> en Google,{" "}
                    <a href={REDIRECT_URI_HELP_URL} target="_blank" rel="noopener noreferrer" className="underline text-primary">
                      abrí este enlace
                    </a>{" "}
                    para copiar la URI exacta que debés agregar en Google Cloud Console.
                  </p>
                </div>
              ) : null}
              <Button
                type="submit"
                isDisabled={loading}
                isLoading={loading}
                className="w-full button button-secondary"
                aria-label={loading ? "Iniciando sesión..." : "Entrar con email"}
              >
                {loading ? "Iniciando sesión..." : "Entrar con email"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function StoreLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-nodo" aria-label="Cargando inicio de sesión">
        <div className="max-w-md w-full px-4">
          <Card className="p-6">
            <CardBody className="flex flex-col gap-4 items-center">
              <Logo width={80} height={85} />
              <p className="text-sm text-gray-500">Cargando...</p>
            </CardBody>
          </Card>
        </div>
      </div>
    }>
      <StoreLoginContent />
    </Suspense>
  );
}
