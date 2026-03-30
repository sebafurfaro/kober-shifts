"use client";

import { useEffect, useState } from "react";
import { Button, Alert, Card, Chip, Spinner } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Typography from "@/app/components/Typography";
import { useMercadoPagoIntegration } from "@/lib/mercadopago-integration-context";
import { MP_OAUTH_ERROR_MESSAGES } from "@/lib/mercadopago-oauth-messages";

export function PaymentsForm() {
    const searchParams = useSearchParams();
    const {
        isMercadoPagoLinked: isLinked,
        isMercadoPagoStatusLoading: isLoading,
        isDisconnecting,
        connectMercadoPago: connect,
        disconnectMercadoPago: disconnect,
        refreshMercadoPagoStatus,
    } = useMercadoPagoIntegration();

    const [refreshingManual, setRefreshingManual] = useState(false);

    const mpErrorParam = searchParams.get("mp_error");
    const mpSuccessParam = searchParams.get("mp_linked");

    useEffect(() => {
        if (searchParams.get("mp_linked") === "1") {
            void refreshMercadoPagoStatus();
        }
    }, [searchParams, refreshMercadoPagoStatus]);

    useEffect(() => {
        if (searchParams.get("mp_error")) {
            void refreshMercadoPagoStatus();
        }
    }, [searchParams, refreshMercadoPagoStatus]);

    async function handleRefreshStatus() {
        setRefreshingManual(true);
        try {
            await refreshMercadoPagoStatus();
        } finally {
            setRefreshingManual(false);
        }
    }

    const statusBusy = isLoading || refreshingManual;
    const showLinked = !statusBusy && isLinked === true;
    const showNotLinked = !statusBusy && isLinked === false;

    return (
        <div className="flex w-full flex-col">
            {mpErrorParam && (
                <Alert color="danger" variant="flat" className="mb-4">
                    {MP_OAUTH_ERROR_MESSAGES[mpErrorParam] || "Error al vincular con Mercado Pago."}
                </Alert>
            )}
            {mpSuccessParam === "1" && (
                <Alert color="success" variant="flat" className="mb-4">
                    Cuenta vinculada correctamente con Mercado Pago.
                </Alert>
            )}
            <Card className="p-4 flex flex-col items-start space-y-4 shadow-none border border-gray-200">
                <Image src="/logo_mp.png" alt="Mercado Pago" width={80} height={60} />
                <Typography variant="h4" color="black">
                    Mercado Pago
                </Typography>

                <div className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 justify-between gap-y-2">
                        <span className="text-sm font-semibold text-slate-800">
                            Estado de la vinculación
                        </span>
                        {statusBusy ? (
                            <Chip
                                size="sm"
                                variant="flat"
                                color="default"
                                startContent={<Spinner size="sm" color="current" classNames={{ wrapper: "w-3 h-3" }} />}
                            >
                                Comprobando…
                            </Chip>
                        ) : showLinked ? (
                            <Chip size="sm" color="success" variant="flat">
                                Vinculado
                            </Chip>
                        ) : (
                            <Chip size="sm" color="warning" variant="flat">
                                No vinculado
                            </Chip>
                        )}
                    </div>
                    <Typography variant="p" color="gray" className="text-sm leading-normal">
                        {statusBusy
                            ? "Consultando el servidor si la cuenta de Mercado Pago está asociada a este negocio."
                            : showLinked
                              ? "Tu cuenta está conectada. Podés cobrar con Mercado Pago y la sección Pagos aparece en el menú lateral (si tenés permiso y la función activa)."
                              : "Todavía no hay una cuenta de Mercado Pago vinculada a este negocio. Usá el botón de abajo para conectar. La sección Pagos en el menú solo aparece cuando la vinculación está activa."}
                    </Typography>
                    <Button
                        size="sm"
                        variant="bordered"
                        className="w-full sm:w-auto"
                        onPress={() => void handleRefreshStatus()}
                        isDisabled={statusBusy}
                        isLoading={refreshingManual}
                    >
                        Actualizar estado
                    </Button>
                </div>

                <Typography variant="p" color="gray" className="text-sm">
                    Conectá tu cuenta de Mercado Pago para recibir pagos y señas de tus clientes.
                </Typography>

                <div className="w-full flex flex-col gap-3">
                    {showLinked ? (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                            <div className="flex items-center gap-1.5 text-success text-sm font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                Cuenta activa
                            </div>
                            <Button
                                variant="bordered"
                                color="danger"
                                className="w-full sm:w-auto"
                                onPress={() => void disconnect()}
                                isLoading={isDisconnecting}
                                isDisabled={isDisconnecting}
                            >
                                Desvincular
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onPress={connect}
                            variant="solid"
                            color="primary"
                            className="w-full"
                            isDisabled={statusBusy}
                        >
                            Vincular Mercado Pago
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
