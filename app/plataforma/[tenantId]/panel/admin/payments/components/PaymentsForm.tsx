"use client";

import { useEffect } from "react";
import { Button, Alert, Card } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Typography from "@/app/components/Typography";
import { WithSkeleton } from "../../../components/skeletons";
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

    const skeletonCard = (
        <Card className="p-4 flex flex-col items-start space-y-4 shadow-none border border-gray-200">
            <div className="h-16 bg-default-100 rounded animate-pulse w-full max-w-[200px]" />
            <div className="h-6 bg-default-100 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-default-100 rounded animate-pulse w-full" />
        </Card>
    );

    return (
        <WithSkeleton loading={isLoading} fallback={skeletonCard}>
            <div className="flex w-full flex-col">
                <div className="">
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
                        <Typography variant="h4" color="black">Mercado Pago</Typography>
                        <Typography variant="p" color="gray">Conecta tu cuenta de Mercado Pago para comenzar a recibir pagos de tus clientes.</Typography>
                        <div className="w-full flex flex-col gap-3">
                            {isLinked === true ? (
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
                                >
                                    Vincular Mercado Pago
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </WithSkeleton>
    );
}
