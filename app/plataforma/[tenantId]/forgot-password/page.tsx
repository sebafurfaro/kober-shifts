"use client"

import React, { useState } from "react";
import { Card, CardBody, Input, Button } from "@heroui/react";
import Typography from "@/app/components/Typography";
import { useParams } from "next/navigation";

export default function ForgotPasswordPage() {
    const params = useParams();
    const tenantId = params.tenantId as string;

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/plataforma/${tenantId}/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            // Haya o no error con el email, mostramos genérico a menos que haya caído el servidor.
            if (!res.ok) {
                throw new Error("Ocurrió un error inesperado al procesar tu solicitud.");
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Error al solicitar el restablecimiento");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-gray-50">
            <Card className="w-full max-w-md shadow-lg rounded-2xl">
                <CardBody className="p-8">
                    <Typography variant="h3" className="text-center text-primary mb-2">Recuperar contraseña</Typography>

                    {success ? (
                        <div className="text-center mt-4">
                            <Typography variant="p" className="text-gray-600 mb-6">
                                Si el correo <b>{email}</b> existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                            </Typography>
                            <Typography variant="p" className="text-gray-400 text-sm">
                                Por favor, revisa tu bandeja de entrada o la carpeta de spam.
                            </Typography>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                            <Typography variant="p" className="text-center text-gray-500 text-sm">
                                Ingresa la dirección de correo electrónico asociada a tu cuenta y te enviaremos un enlace seguro para restablecer tu contraseña.
                            </Typography>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div>
                                <Input
                                    isRequired
                                    type="email"
                                    label="Correo electrónico"
                                    placeholder="ejemplo@correo.com"
                                    variant="bordered"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <Button
                                type="submit"
                                color="primary"
                                className="w-full font-semibold"
                                isLoading={loading}
                            >
                                Enviar enlace de recuperación
                            </Button>
                        </form>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
