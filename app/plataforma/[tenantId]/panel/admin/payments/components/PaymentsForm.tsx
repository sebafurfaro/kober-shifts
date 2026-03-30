"use client";

import { Button, Alert, Card } from "@heroui/react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Typography from "@/app/components/Typography";
import { WithSkeleton } from "../../../components/skeletons";
import { useMercadoPagoAccount } from "@/hooks/useMercadoPagoAccount";
import { MP_OAUTH_ERROR_MESSAGES } from "@/lib/mercadopago-oauth-messages";

export function PaymentsForm() {
    const params = useParams();
    const tenantId = params.tenantId as string;
    
    const { 
        isLinked, 
        isLoading, 
        isDisconnecting, 
        connect, 
        disconnect, 
        mpErrorParam, 
        mpSuccessParam 
    } = useMercadoPagoAccount(tenantId);

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
                            Cuenta vinculada correctamente con MercadoPago.
                        </Alert>
                    )}
                    <Card className="p-4 flex flex-col items-start space-y-4 shadow-none border border-gray-200">
                        <Image src="/logo_mp.png" alt="Mercado Pago" width={80} height={60} />
                        <Typography variant="h4" color="black">Mercado Pago</Typography>
                        <Typography variant="p" color="gray">Conecta tu cuenta de Mercado Pago para comenzar a recibir pagos de tus clientes.</Typography>
                        {isLinked ? (
                            <Button
                                variant="solid"
                                color="danger"
                                className="w-full"
                                onPress={disconnect}
                                isLoading={isDisconnecting}
                                isDisabled={isDisconnecting}
                            >
                                Desvincular
                            </Button>
                        ) : (
                            <Button
                                onPress={connect}
                                variant="solid"
                                color="primary"
                                className="w-full"
                            >
                                Conectar
                            </Button>
                        )}
                    </Card>
                </div>
            </div>
        </WithSkeleton>
    );
}
