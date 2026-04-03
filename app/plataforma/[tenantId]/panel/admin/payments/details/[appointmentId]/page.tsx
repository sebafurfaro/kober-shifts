"use client";

import { PanelHeader } from "../../../../components/PanelHeader";
import { Card, CardBody, Button, Spinner, Divider } from "@heroui/react";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Section } from "../../../../components/layout/Section";
import Typography from "@/app/components/Typography";
import { useMercadoPagoIntegration } from "@/lib/mercadopago-integration-context";

type PaymentDetail = {
    appointmentId: string;
    appointmentDate: string;
    serviceName: string;
    servicePrice: number;
    seniaPercent: number;
    patientName: string | null;
    patientPhone: string | null;
    patientEmail: string | null;
    mpAmount: number | null;
    rawMpStatus: string | null;
    computedPaymentStatus: "Pendiente" | "Seña paga" | "Pagado";
};

export default function PaymentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const tenantId = params.tenantId as string;
    const appointmentId = params.appointmentId as string;

    const { isMercadoPagoStatusLoading, isPagosFeatureEnabled } = useMercadoPagoIntegration();

    const [data, setData] = React.useState<PaymentDetail | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [updating, setUpdating] = React.useState(false);

    const loadData = React.useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/plataforma/${tenantId}/admin/payments/records/${appointmentId}`);
            if (!res.ok) throw new Error("Not found");
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [tenantId, appointmentId]);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const updateStatus = async (status: string, overrideAmount?: number) => {
        if (!data) return;
        try {
            setUpdating(true);
            const amountToSet = overrideAmount ?? Number(data.servicePrice ?? 0);
            const res = await fetch(`/api/plataforma/${tenantId}/admin/payments/records/${appointmentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, amount: amountToSet }),
            });
            if (!res.ok) throw new Error("Error updating status");
            await loadData();
        } catch (error) {
            console.error("Failed to update status", error);
            alert("No se pudo actualizar el estado.");
        } finally {
            setUpdating(false);
        }
    };

    if (isPagosFeatureEnabled && isMercadoPagoStatusLoading) {
        return (
            <Section>
                <div className="flex justify-center py-24">
                    <Spinner size="lg" label="Cargando detalles..." />
                </div>
            </Section>
        );
    }

    if (loading) {
        return (
            <Section>
                <div className="flex justify-center py-24">
                    <Spinner size="lg" label="Cargando detalles..." />
                </div>
            </Section>
        );
    }

    if (!data) {
        return (
            <Section>
                <PanelHeader
                    title="Detalle de Pago"
                    subtitle="El registro no existe o no tiene pago asociado."
                    action={{ label: "Volver", onClick: () => router.push(`/plataforma/${tenantId}/panel/admin/payments`) }}
                />
            </Section>
        );
    }

    const cleanPhone = data.patientPhone ? data.patientPhone.replace(/\D/g, "") : "";
    const servicePriceNum = Number(data.servicePrice ?? 0);
    const seniaPercentNum = Number(data.seniaPercent ?? 0);
    const seniaAmount = servicePriceNum * (seniaPercentNum / 100);

    const renderStatusBadge = (status: "Pendiente" | "Seña paga" | "Pagado") => {
        let colorClass = "bg-warning text-warning-foreground";
        if (status === "Pagado") colorClass = "bg-success/20 text-success";
        if (status === "Seña paga") colorClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colorClass}`}>
                {status}
            </span>
        );
    };

    return (
        <Section>
            <PanelHeader
                title={`Detalles de Cobro - Turno de ${data.patientName}`}
                subtitle="Gestión manual de pagos, historial y contacto del cliente."
                action={{ label: "Volver a Pagos", onClick: () => router.push(`/plataforma/${tenantId}/panel/admin/payments`) }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card>
                    <CardBody className="p-6">
                        <Typography variant="h5" className="mb-4">Información del Cliente</Typography>
                        <ul className="space-y-4">
                            <li>
                                <span className="text-default-500 block text-sm">Nombre</span>
                                <span className="font-semibold text-lg">{data.patientName || "Cliente Anónimo"}</span>
                            </li>
                            <li>
                                <span className="text-default-500 block text-sm">Teléfono</span>
                                <span className="font-semibold">{data.patientPhone || "No especificado"}</span>
                            </li>
                            <li>
                                <span className="text-default-500 block text-sm">Email</span>
                                <span className="font-semibold">{data.patientEmail || "No especificado"}</span>
                            </li>
                        </ul>

                        <Divider className="my-6" />

                        <Typography variant="h6" className="mb-4">Contactar Cliente</Typography>
                        <div className="flex gap-4">
                            <Button
                                as="a"
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                color="success"
                                variant="flat"
                                isDisabled={!cleanPhone}
                            >
                                WhatsApp
                            </Button>
                            <Button
                                as="a"
                                href={`mailto:${data.patientEmail}`}
                                color="primary"
                                variant="flat"
                                isDisabled={!data.patientEmail}
                            >
                                Enviar Correo
                            </Button>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <Typography variant="h5">Información Comercial</Typography>
                            {renderStatusBadge(data.computedPaymentStatus)}
                        </div>
                        <ul className="space-y-4">
                            <li>
                                <span className="text-default-500 block text-sm">Servicio</span>
                                <span className="font-semibold text-lg">{data.serviceName}</span>
                            </li>
                            <li className="flex justify-between">
                                <div>
                                    <span className="text-default-500 block text-sm">Costo Total</span>
                                    <span className="font-semibold">${servicePriceNum.toFixed(2)}</span>
                                </div>
                                {seniaPercentNum > 0 && (
                                    <div className="text-right">
                                        <span className="text-default-500 block text-sm">Seña ({seniaPercentNum}%)</span>
                                        <span className="font-semibold">${seniaAmount.toFixed(2)}</span>
                                    </div>
                                )}
                            </li>
                            <li>
                                <span className="text-default-500 block text-sm">Fecha de Turno</span>
                                <span className="font-semibold">{new Date(data.appointmentDate).toLocaleString()}</span>
                            </li>
                            <li>
                                <span className="text-default-500 block text-sm">Estado Crudo BD (Debug)</span>
                                <span className="font-mono text-xs">{data.rawMpStatus || "N/A"}</span>
                            </li>
                        </ul>

                        <Divider className="my-6" />

                        <Typography variant="h6" className="mb-4">Acciones Manuales de Pago</Typography>
                        {data.computedPaymentStatus !== "Pagado" && (
                            <p className="text-sm text-default-500 mb-4">
                                Si recibiste el pago mediante transferencia directa, efectivo, o algún cobro por QR que no notificó, podés dar el cobro como por cerrado acá:
                            </p>
                        )}
                        <div className="flex flex-wrap gap-3">
                            <Button
                                color="success"
                                onClick={() => updateStatus("fully_paid", servicePriceNum)}
                                variant="solid"
                                isLoading={updating}
                                isDisabled={data.computedPaymentStatus === "Pagado"}
                                className={data.computedPaymentStatus === "Pagado" ? "cursor-not-allowed" : "cursor-pointer"}
                            >
                                Marcar como 100% Pagado
                            </Button>

                            {seniaPercentNum > 0 && seniaPercentNum < 100 && (
                                <Button
                                    color="primary"
                                    variant="solid"
                                    onClick={() => updateStatus("approved", seniaAmount)}
                                    isLoading={updating}
                                    isDisabled={data.computedPaymentStatus === "Seña paga" || data.computedPaymentStatus === "Pagado"}
                                >
                                    Marcar Seña como Pagada
                                </Button>
                            )}

                            <Button
                                color="warning"
                                variant="solid"
                                onClick={() => updateStatus("pending", 0)}
                                isLoading={updating}
                                isDisabled={data.computedPaymentStatus === "Pendiente"}
                            >
                                Revertir a Pendiente
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </Section>
    );
}
