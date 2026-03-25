"use client"

import React, { useState, useEffect } from "react";
import { Card, CardBody, Input, Button } from "@heroui/react";
import Typography from "@/app/components/Typography";
import { useParams, useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
    const params = useParams();
    const tenantId = params.tenantId as string;
    const searchParams = useSearchParams();
    const router = useRouter();

    const [token, setToken] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const urlToken = searchParams.get("token");
        if (urlToken) {
            setToken(urlToken);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/plataforma/${tenantId}/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token, password })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "El enlace es inválido o ha expirado.");
            }

            setSuccess(true);
            setTimeout(() => {
                router.push(`/plataforma/${tenantId}/login`);
            }, 3000);
        } catch (err: any) {
            setError(err.message || "Error al restablecer contraseña");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8">
                <Card className="w-full max-w-md shadow-sm">
                    <CardBody className="p-8 text-center text-gray-500">
                        <Typography variant="h4" className="text-gray-800 mb-2">Enlace inválido</Typography>
                        <p>No se encontró el token de seguridad. Por favor, solicita restablecer tu contraseña nuevamente desde la pantalla de inicio de sesión.</p>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto px-4 flex flex-col items-center justify-center min-h-[80vh]">
            <Card className="w-full shadow-lg rounded-2xl">
                <CardBody className="p-8">
                    {success ? (
                        <div className="text-center space-y-4">
                            <Typography variant="h4" className="text-success mb-2">¡Contraseña actualizada!</Typography>
                            <Typography variant="p" className="text-gray-600">
                                Tu contraseña ha sido cambiada exitosamente.
                            </Typography>
                            <Typography variant="p" className="text-gray-400 text-sm">
                                Serás redirigido al inicio de sesión en unos segundos...
                            </Typography>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="text-center mb-6">
                                <Typography variant="h3" className="text-primary mb-2">Crear nueva contraseña</Typography>
                                <Typography variant="p" className="text-gray-500 text-sm">
                                    Ingresa tu nueva contraseña para acceder a tu cuenta.
                                </Typography>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <Input
                                    isRequired
                                    type="password"
                                    label="Nueva contraseña"
                                    placeholder="••••••••"
                                    variant="bordered"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <Input
                                    isRequired
                                    type="password"
                                    label="Confirmar contraseña"
                                    placeholder="••••••••"
                                    variant="bordered"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <Button
                                type="submit"
                                color="primary"
                                className="w-full font-semibold mt-4"
                                isLoading={loading}
                            >
                                Guardar contraseña
                            </Button>
                        </form>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}