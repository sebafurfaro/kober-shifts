"use client";

import { Button, Alert, Card } from "@heroui/react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import * as React from "react";

const MP_ERROR_MESSAGES: Record<string, string> = {
    missing_code_or_state: "Faltó código o estado en la respuesta de MercadoPago.",
    server_config: "MercadoPago no está configurado en el servidor.",
    token_exchange_failed: "No se pudo obtener el token. Verificá la URL de redirección en tu app de MercadoPago.",
    callback_failed: "Error al procesar la conexión.",
    oauth_not_configured:
        "Vincular con OAuth requiere MERCADOPAGO_CLIENT_ID y MERCADOPAGO_CLIENT_SECRET (creá una Aplicación en Mercado Pago Developers). Si solo usás Public Key y Access Token en variables de entorno, no necesitás vincular: configurá MERCADOPAGO_ACCESS_TOKEN y los cobros usarán esa cuenta.",
};

export function PaymentsForm() {
    const params = useParams();
    const searchParams = useSearchParams();
    const tenantId = params.tenantId as string;
    const [loading, setLoading] = React.useState(true);
    const [mpLinked, setMpLinked] = React.useState(false);
    const [disconnecting, setDisconnecting] = React.useState(false);

    React.useEffect(() => {
        async function loadStatus() {
            try {
                const res = await fetch(`/api/plataforma/${tenantId}/integrations/mercadopago/status`, {
                    credentials: "include",
                });
                if (res.ok) {
                    const data = await res.json();
                    setMpLinked(!!data.linked);
                }
            } catch {
                setMpLinked(false);
            } finally {
                setLoading(false);
            }
        }
        loadStatus();
    }, [tenantId]);

    const mpLinkedParam = searchParams.get("mp_linked");
    const mpErrorParam = searchParams.get("mp_error");
    React.useEffect(() => {
        if (mpLinkedParam === "1") setMpLinked(true);
        if (mpErrorParam) setMpLinked(false);
    }, [mpLinkedParam, mpErrorParam]);

    const handleDisconnect = React.useCallback(async () => {
        if (disconnecting) return;
        try {
            setDisconnecting(true);
            const res = await fetch(`/api/plataforma/${tenantId}/integrations/mercadopago/disconnect`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Error al desvincular");
            }
            setMpLinked(false);
        } catch (err) {
            console.error(err);
            setMpLinked(false);
        } finally {
            setDisconnecting(false);
        }
    }, [tenantId, disconnecting]);

    return (
        <div className="flex w-full flex-col">
            <h2 className="text-2xl font-bold mb-4">Integraciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {searchParams.get("mp_error") && (
                    <Alert color="danger" variant="flat" className="mb-4">
                        {MP_ERROR_MESSAGES[searchParams.get("mp_error") || ""] || "Error al vincular con MercadoPago."}
                    </Alert>
                )}
                {searchParams.get("mp_linked") === "1" && (
                    <Alert color="success" variant="flat" className="mb-4">
                        Cuenta vinculada correctamente con MercadoPago.
                    </Alert>
                )}
                {loading ? (
                    <Card className="p-4 flex flex-col items-start space-y-4 shadow-none border border-gray-200">
                        <div className="h-16 bg-default-100 rounded animate-pulse w-full max-w-[200px]" />
                        <div className="h-6 bg-default-100 rounded animate-pulse w-3/4" />
                        <div className="h-4 bg-default-100 rounded animate-pulse w-full" />
                    </Card>
                ) : (
                    <Card className="p-4 flex flex-col items-start space-y-4 shadow-none border border-gray-200">
                        <Image src="/logo_mp.png" alt="Mercado Pago" width={80} height={60} />
                        <h2 className="text-2xl font-bold mb-4 mt-8">Mercado Pago</h2>
                        <p>Conecta tu cuenta de Mercado Pago para comenzar a recibir pagos de tus clientes.</p>
                        {mpLinked ? (
                            <Button
                                variant="solid"
                                color="danger"
                                className="w-full"
                                onPress={handleDisconnect}
                                isLoading={disconnecting}
                                isDisabled={disconnecting}
                            >
                                Desvincular
                            </Button>
                        ) : (
                            <Button
                                as="a"
                                variant="solid"
                                color="primary"
                                className="w-full"
                                href={`/api/plataforma/${tenantId}/integrations/mercadopago/authorize`}
                            >
                                Conectar
                            </Button>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
}
