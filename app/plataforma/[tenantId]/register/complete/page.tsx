"use client";

import { useState, useEffect } from "react";
import { Button, Input, Card, CardBody, Spinner } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function CompleteRegistrationPage() {
    const router = useRouter();
    const params = useParams();
    const tenantId = params.tenantId as string;

    const [user, setUser] = useState<{ name: string; isPending: boolean } | null>(null);
    const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch(`/api/plataforma/${tenantId}/auth/me`);
                if (!res.ok) {
                    setStatus("unauthenticated");
                    router.push(`/plataforma/${tenantId}/login`);
                    return;
                }
                const data = await res.json();
                if (!data.isPending) {
                    setStatus("authenticated");
                    router.push(`/plataforma/${tenantId}/panel`);
                    return;
                }
                setUser(data);
                setStatus("authenticated");
            } catch (err) {
                setStatus("unauthenticated");
                router.push(`/plataforma/${tenantId}/login`);
            }
        }
        checkSession();
    }, [tenantId, router]);

    if (status === "loading" || !user) {
        return (
            <div className="flex justify-center py-8">
                <Spinner />
            </div>
        );
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/plataforma/${tenantId}/auth/complete-registration`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (!res.ok) {
                const json = (await res.json().catch(() => ({}))) as { error?: string };
                setError(json.error ?? "Error al actualizar contraseña");
                return;
            }

            // After complete registration, logout to force fresh login with new password
            await fetch(`/api/plataforma/${tenantId}/auth/logout`, { method: "POST" });
            router.push(`/plataforma/${tenantId}/login?message=registration_complete`);

        } catch (err) {
            setError("Ocurrió un error inesperado");
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
                        <h2 className="text-2xl font-bold">Completar Registro</h2>
                        <p className="text-base">
                            Hola {user.name}, para finalizar tu registro por favor crea una contraseña.
                        </p>

                        <Input
                            label="Contraseña"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onValueChange={setPassword}
                            isDisabled={loading}
                            autoComplete="new-password"
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
                            isRequired
                        />
                        <Input
                            label="Confirmar Contraseña"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onValueChange={setConfirmPassword}
                            isDisabled={loading}
                            autoComplete="new-password"
                            isRequired
                        />

                        {error ? (
                            <p className="text-sm text-danger">{error}</p>
                        ) : null}

                        <Button type="submit" color="primary" isDisabled={loading} isLoading={loading} className="w-full">
                            Finalizar Registro
                        </Button>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
}
