"use client";

import { PanelHeader } from "../../components/PanelHeader";
import { Card, CardBody, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Spinner, Pagination, Divider } from "@heroui/react";
import * as React from "react";
import { useParams } from "next/navigation";
import { Section } from "../../components/layout/Section";
import Typography from "@/app/components/Typography";

type PaymentRecord = {
    _id: string;
    appointmentId?: string;
    amount?: number;
    status?: string;
    purpose?: string;
    provider?: string;
    createdAt?: string;
    mercadoPago?: unknown;
    mercadoPagoRaw?: unknown;
};

type MercadoPagoPOS = {
    id: number | string;
    name?: string;
    external_id?: string;
    external_store_id?: string;
    store_id?: number;
    category?: number;
    date_created?: string;
    date_last_updated?: string;
    qr?: { image?: string; template_document?: string; template_image?: string };
};

export default function AdminPaymentsPage() {
    const params = useParams();
    const tenantId = params.tenantId as string;
    const [records, setRecords] = React.useState<PaymentRecord[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [posList, setPosList] = React.useState<MercadoPagoPOS[]>([]);
    const [posLoading, setPosLoading] = React.useState(true);
    const [mpLinked, setMpLinked] = React.useState(false);

    React.useEffect(() => {
        async function loadPos() {
            try {
                setPosLoading(true);
                const res = await fetch(`/api/plataforma/${tenantId}/integrations/mercadopago/pos`, {
                    credentials: "include",
                });
                if (!res.ok) return;
                const data = await res.json();
                setPosList(Array.isArray(data.pos) ? data.pos : []);
                setMpLinked(!!data.linked);
            } catch {
                setPosList([]);
            } finally {
                setPosLoading(false);
            }
        }
        loadPos();
    }, [tenantId]);

    React.useEffect(() => {
        async function loadRecords() {
            try {
                setLoading(true);
                const res = await fetch(
                    `/api/plataforma/${tenantId}/admin/payments/records?page=${page}&limit=20`,
                    { credentials: "include" }
                );
                if (!res.ok) throw new Error("Failed to load payments");
                const data = await res.json();
                setRecords(data?.payments || []);
                setTotalPages(data?.pagination?.totalPages || 1);
            } catch (error) {
                console.error("Error loading payments records:", error);
            } finally {
                setLoading(false);
            }
        }
        loadRecords();
    }, [tenantId, page]);

    return (
        <Section>
                <PanelHeader
                    title="Pagos"
                    subtitle="Gestion de pagos por pasarelas, transferencias, depocitos, etc."
                />
            

            {mpLinked && (
                <Card className="mb-8">
                    <CardBody className="p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Punto de venta (Mercado Pago)</h3>
                        {posLoading ? (
                            <div className="flex justify-center py-8">
                                <Spinner size="lg" label="Cargando punto de venta..." />
                            </div>
                        ) : posList.length === 0 ? (
                            <p className="text-default-500">No hay puntos de venta asociados a la cuenta vinculada.</p>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                                {posList.map((pos) => (
                                    <Card key={String(pos.id)} shadow="none" className="border border-gray-200">
                                        <CardBody className="p-4">
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                {pos.qr?.image && (
                                                    <div className="shrink-0">
                                                        <a
                                                            href={pos.qr.image}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block"
                                                        >
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={pos.qr.image}
                                                                alt={`QR ${pos.name || pos.id}`}
                                                                width={120}
                                                                height={120}
                                                                className="rounded"
                                                            />
                                                        </a>
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-800">{pos.name || "Sin nombre"}</p>
                                                    <p className="text-sm text-default-500 mt-1">ID: {String(pos.id)}</p>
                                                    {pos.external_id && (
                                                        <p className="text-sm text-default-500">External ID: {pos.external_id}</p>
                                                    )}
                                                    {pos.external_store_id && (
                                                        <p className="text-sm text-default-500">Tienda: {pos.external_store_id}</p>
                                                    )}
                                                    {pos.date_created && (
                                                        <p className="text-sm text-default-500 mt-2">
                                                            Creado: {new Date(pos.date_created).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                    {pos.date_last_updated && (
                                                        <p className="text-sm text-default-500">
                                                            Actualizado: {new Date(pos.date_last_updated).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                    {pos.qr?.template_document && (
                                                        <a
                                                            href={pos.qr.template_document}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-primary mt-2 inline-block"
                                                        >
                                                            Descargar plantilla PDF
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            <Card className="mb-8">
                <CardBody className="p-6">
                    <div className="hidden md:block">
                        <Table aria-label="Tabla de pagos">
                            <TableHeader>
                                <TableColumn>ID Turno</TableColumn>
                                <TableColumn>Tipo</TableColumn>
                                <TableColumn>Proveedor</TableColumn>
                                <TableColumn>Estado</TableColumn>
                                <TableColumn align={"end" as "start" | "center" | "end"}>
                                    Monto
                                </TableColumn>
                                <TableColumn>Fecha</TableColumn>
                                <TableColumn>Detalle</TableColumn>
                            </TableHeader>
                            <TableBody
                                isLoading={loading}
                                loadingContent={<Spinner label="Cargando..." />}
                                emptyContent={loading ? null : "No hay pagos registrados"}
                            >
                                {records.map((payment) => (
                                    <TableRow key={payment._id}>
                                        <TableCell>{payment.appointmentId || "-"}</TableCell>
                                        <TableCell>{payment.purpose || "-"}</TableCell>
                                        <TableCell>{payment.provider || "-"}</TableCell>
                                        <TableCell>{payment.status || "-"}</TableCell>
                                        <TableCell className="text-right">
                                            {typeof payment.amount === "number" ? payment.amount.toFixed(2) : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <details className="text-xs">
                                                <summary className="cursor-pointer text-primary">Ver</summary>
                                                <pre className="whitespace-pre-wrap text-[11px] text-slate-600 mt-2">
                                                    {JSON.stringify(
                                                        payment.mercadoPagoRaw ?? payment.mercadoPago ?? {},
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            </details>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex md:hidden flex-col gap-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Spinner label="Cargando..." />
                            </div>
                        ) : records.length === 0 ? (
                            <Typography variant="p" color="gray">No hay pagos registrados</Typography>
                        ) : (
                            records.map((payment) => (
                                <div key={payment._id} className="flex flex-col space-y-3">
                                    <Typography variant="h6" color="black">
                                        {payment.appointmentId ? `Turno ${payment.appointmentId}` : "—"}
                                    </Typography>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col space-y-1">
                                            <Typography variant="p" color="gray" opacity={50}>Tipo</Typography>
                                            <Typography variant="p">{payment.purpose ?? "—"}</Typography>
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <Typography variant="p" color="gray" opacity={50}>Estado</Typography>
                                            <Typography variant="p">{payment.status ?? "—"}</Typography>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col space-y-1">
                                            <Typography variant="p" color="gray" opacity={50}>Proveedor</Typography>
                                            <Typography variant="p">{payment.provider ?? "—"}</Typography>
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <Typography variant="p" color="gray" opacity={50}>Monto</Typography>
                                            <Typography variant="p">
                                                {typeof payment.amount === "number" ? payment.amount.toFixed(2) : "—"}
                                            </Typography>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col space-y-1 col-span-2">
                                            <Typography variant="p" color="gray" opacity={50}>Fecha</Typography>
                                            <Typography variant="p">
                                                {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "—"}
                                            </Typography>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 mt-3">
                                        <details className="text-xs">
                                            <summary className="cursor-pointer text-primary">Ver detalle</summary>
                                            <pre className="whitespace-pre-wrap text-[11px] text-slate-600 mt-2 overflow-x-auto">
                                                {JSON.stringify(
                                                    payment.mercadoPagoRaw ?? payment.mercadoPago ?? {},
                                                    null,
                                                    2
                                                )}
                                            </pre>
                                        </details>
                                    </div>
                                    <Divider className="my-4" />
                                </div>
                            ))
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center mt-4">
                            <Pagination
                                total={totalPages}
                                page={page}
                                onChange={setPage}
                                showControls
                                showShadow
                            />
                        </div>
                    )}
                </CardBody>
            </Card>
        </Section>
    );
}