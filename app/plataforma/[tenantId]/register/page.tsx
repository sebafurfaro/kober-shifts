"use client";

import { useState, useEffect, useMemo } from "react";
import { Button, Input, Card, CardBody } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Role } from "@/lib/types";

function ValidationItem({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {isValid ? (
        <CheckCircle2 className="w-4 h-4 text-success" />
      ) : (
        <XCircle className="w-4 h-4 text-gray-400 opacity-50" />
      )}
      <span className={`text-xs transition-colors ${isValid ? "text-success" : "text-gray-500"}`}>
        {text}
      </span>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);

  const validations = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!Object.values(validations).every(Boolean)) {
      setError("La contraseña no cumple con los requisitos de seguridad.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "Error");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { role?: Role };
      const role = data.role;
      if (role === Role.ADMIN || role === Role.SUPERVISOR) {
        router.push(`/plataforma/${tenantId}/panel/admin`);
      } else if (role === Role.PROFESSIONAL) {
        router.push(`/plataforma/${tenantId}/panel/professional`);
      } else {
        router.push(`/plataforma/${tenantId}/panel/patient`);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleShowPassword = () => setShowPassword((show) => !show);

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold">Crear cuenta</h2>
            <Input
              label="Nombre"
              value={firstName}
              onValueChange={setFirstName}
              autoComplete="given-name"
              isRequired
            />
            <Input
              label="Apellido"
              value={lastName}
              onValueChange={setLastName}
              autoComplete="family-name"
              isRequired
            />
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
              type={showPassword ? "text" : "password"}
              value={password}
              onValueChange={setPassword}
              autoComplete="new-password"
              isInvalid={isPasswordTouched && !Object.values(validations).every(Boolean)}
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={handleShowPassword}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              }
              onBlur={() => setIsPasswordTouched(true)}
              isRequired
            />

            {/* Password Requirements */}
            <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-xs font-semibold mb-2">Requisitos de la contraseña:</p>
              <div className="space-y-1">
                <ValidationItem isValid={validations.minLength} text="Mínimo 8 caracteres" />
                <ValidationItem isValid={validations.hasUpperCase} text="Al menos una mayúscula" />
                <ValidationItem isValid={validations.hasNumber} text="Al menos un número" />
                <ValidationItem isValid={validations.hasSpecialChar} text="Al menos un carácter especial (@$!%*?&)" />
              </div>
            </div>

            {error ? (
              <p className="text-sm text-danger">{error}</p>
            ) : null}
            <Button
              type="submit"
              color="primary"
              isDisabled={loading || (isPasswordTouched && !Object.values(validations).every(Boolean))}
              isLoading={loading}
              className="w-full"
            >
              Registrarme
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
              Registrarse con Google
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}


