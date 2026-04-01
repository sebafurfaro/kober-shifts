"use client";

import { PanelHeader } from "../../components/PanelHeader";
import { Alert, Card, CardBody, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Spinner, Pagination, Divider, Input, Select, SelectItem, CheckboxGroup, Checkbox, Button, Accordion, AccordionItem } from "@heroui/react";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Section } from "../../components/layout/Section";
import Typography from "@/app/components/Typography";
import { useFeatureGate } from "@/lib/use-feature-gate";

type ExtendedPaymentRecord = {
    appointmentId: string;
    appointmentDate: string;
    appointmentStatus: string;
    serviceName: string;
    servicePrice: number;
    seniaPercent: number;
    patientName: string | null;
    patientEmail: string | null;
    patientPhone: string | null;
    paymentRecordId: string | null;
    mpAmount: number | null;
    mpStatus: string | null;
    computedPaymentStatus: "Pendiente" | "Seña paga" | "Pagado";
    mpUpdatedAt: string | null;
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
    const router = useRouter();
    const tenantId = params.tenantId as string;
    const { isFeatureEnabled: showPagosEnabled, isLoading: featureGateLoading } = useFeatureGate("show_pagos");
    const [records, setRecords] = React.useState<ExtendedPaymentRecord[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [listError, setListError] = React.useState<string | null>(null);

    // POS State
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
        if (showPagosEnabled) {
            loadPos();
        }
    }, [tenantId, showPagosEnabled]);

    // Filters state
    const [searchQuery, setSearchQuery] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 400);
        return () => clearTimeout(handler);
    }, [searchQuery]);
    const [order, setOrder] = React.useState("date_desc");
    const [withSenia, setWithSenia] = React.useState<string>("all");
    const [statusFilters, setStatusFilters] = React.useState<string[]>([]);
    const [dateFilter, setDateFilter] = React.useState("");

    React.useEffect(() => {
        setPage(1); // Reset page on filter change
    }, [debouncedSearch, order, withSenia, statusFilters, dateFilter]);

    React.useEffect(() => {
        const ac = new AbortController();

        async function loadRecords() {
            try {
                setLoading(true);
                setListError(null);
                const query = new URLSearchParams();
                query.set("page", page.toString());
                query.set("limit", "20");
                if (debouncedSearch) query.set("search", debouncedSearch);
                if (order) query.set("order", order);
                if (withSenia === "true") query.set("withSenia", "true");
                else if (withSenia === "false") query.set("withSenia", "false");
                if (statusFilters.length > 0) query.set("statusFilters", statusFilters.join(","));
                if (dateFilter) query.set("date", dateFilter);

                const res = await fetch(
                    `/api/plataforma/${tenantId}/admin/payments/records?${query.toString()}`,
                    { credentials: "include", signal: ac.signal }
                );
                if (ac.signal.aborted) return;

                if (!res.ok) {
                    const msg =
                        res.status === 403
                            ? "Sin permiso para ver cobros (probá con cuenta administrador o supervisor)."
                            : `No se pudieron cargar los cobros (${res.status}).`;
                    setListError(msg);
                    setRecords([]);
                    setTotalPages(1);
                    return;
                }
                const data = (await res.json()) as { payments?: ExtendedPaymentRecord[]; pagination?: { totalPages?: number } };
                if (ac.signal.aborted) return;

                setListError(null);
                setRecords(Array.isArray(data?.payments) ? data.payments : []);
                setTotalPages(
                    typeof data?.pagination?.totalPages === "number" && data.pagination.totalPages > 0
                        ? data.pagination.totalPages
                        : 1
                );
            } catch (error) {
                if (ac.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
                    return;
                }
                console.error("Error loading payments records:", error);
                setListError("Error de red al cargar cobros.");
                setRecords([]);
                setTotalPages(1);
            } finally {
                setLoading(false);
            }
        }
        if (!featureGateLoading && showPagosEnabled) {
            void loadRecords();
        }
        return () => {
            ac.abort();
        };
    }, [tenantId, page, debouncedSearch, order, withSenia, statusFilters, dateFilter, featureGateLoading, showPagosEnabled]);

    const clearFilters = React.useCallback(() => {
        setSearchQuery("");
        setDebouncedSearch("");
        setOrder("date_desc");
        setWithSenia("all");
        setStatusFilters([]);
        setDateFilter("");
        setPage(1);
    }, []);

    if (featureGateLoading) {
        return (
            <Section>
                <div className="flex justify-center py-24">
                    <Spinner size="lg" label="Cargando..." />
                </div>
            </Section>
        );
    }
    const renderStatusBadge = (status: "Pendiente" | "Seña paga" | "Pagado") => {
        let colorClass = "bg-warning text-warning-foreground"; // Pendiente default
        if (status === "Pagado") colorClass = "bg-success/20 text-success";
        if (status === "Seña paga") colorClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"; // Celeste
        return (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>
                {status}
            </span>
        );
    };

    return (
        <Section>
            <PanelHeader
                title="Cobros de Turnos"
                subtitle="Visualizá y gestioná los cobros de turnos con servicio asociado. Usá los filtros para encontrar pagos específicos."
            />

            {listError && (
                <Alert color="danger" className="mb-4" onClose={() => setListError(null)}>
                    {listError}
                </Alert>
            )}

            {mpLinked && (
                <Accordion className="mb-8 w-full" variant="splitted">
                    <AccordionItem className="p-6" title="QR para cobros con Mercado Pago">
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
                                                            Descargar QR en PDF
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </AccordionItem>
                </Accordion>
            )}

            <Card className="mb-6">
                <CardBody className="p-4 sm:p-6 gap-4 border border-default-200 shadow-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <Input
                                type="text"
                                label="Buscador"
                                placeholder="Nombre de cliente o servicio"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                isClearable
                                onClear={() => setSearchQuery("")}
                            />
                        </div>
                        <div>
                            <Input
                                type="date"
                                label="Fecha"
                                placeholder="Filtrar por fecha"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>
                        <div>
                            <Select
                                label="Ordenar por"
                                selectedKeys={new Set([order])}
                                onSelectionChange={(keys) => {
                                    const k = Array.from(keys)[0] as string | undefined;
                                    if (k) setOrder(k);
                                }}
                            >
                                <SelectItem key="date_desc">Fecha (más recientes)</SelectItem>
                                <SelectItem key="date_asc">Fecha (más antiguos)</SelectItem>
                                <SelectItem key="price_desc">Precio (Mayor a Menor)</SelectItem>
                                <SelectItem key="price_asc">Precio (Menor a Mayor)</SelectItem>
                            </Select>
                        </div>
                        <div>
                            <Select
                                label="Filtro de Seña"
                                description="Solo «con seña» oculta turnos de pago total (seña 0%)."
                                selectedKeys={new Set([withSenia])}
                                onSelectionChange={(keys) => {
                                    const k = Array.from(keys)[0] as string | undefined;
                                    if (k) setWithSenia(k);
                                }}
                            >
                                <SelectItem key="all">Todos los cobros</SelectItem>
                                <SelectItem key="true">Servicios con Seña</SelectItem>
                                <SelectItem key="false">Servicios sin Seña</SelectItem>
                            </Select>
                        </div>
                    </div>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <CheckboxGroup
                            label="Filtrar por Estados"
                            orientation="horizontal"
                            value={statusFilters}
                            onValueChange={setStatusFilters}
                        >
                            <Checkbox value="Pendiente">Pendiente</Checkbox>
                            <Checkbox value="Seña paga">Seña paga</Checkbox>
                            <Checkbox value="Pagado">Pagado</Checkbox>
                        </CheckboxGroup>
                        <Button size="sm" variant="flat" onPress={clearFilters}>
                            Limpiar filtros
                        </Button>
                    </div>
                </CardBody>
            </Card>

            <Card className="mb-8">
                <CardBody className="p-6">
                    <div className="hidden md:block">
                        <Table aria-label="Tabla de pagos de turnos">
                            <TableHeader>
                                <TableColumn>Cliente</TableColumn>
                                <TableColumn>Servicio (Precio)</TableColumn>
                                <TableColumn>Fecha Turno</TableColumn>
                                <TableColumn>Estado Cobro</TableColumn>
                                <TableColumn align={"end" as "start" | "center" | "end"}>
                                    Acciones
                                </TableColumn>
                            </TableHeader>
                            <TableBody
                                isLoading={loading}
                                loadingContent={<Spinner label="Cargando..." />}
                                emptyContent={loading ? null : "No hay turnos con pago registrado para los filtros aplicados"}
                            >
                                {records.map((payment) => (
                                    <TableRow key={payment.appointmentId}>
                                        <TableCell>
                                            <div>
                                                <p className="font-semibold">{payment.patientName || "Anónimo"}</p>
                                                {payment.patientPhone && <p className="text-xs text-default-500">{payment.patientPhone}</p>}
                                                {payment.patientEmail && <p className="text-xs text-default-500">{payment.patientEmail}</p>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium">{payment.serviceName}</p>
                                            <p className="text-xs text-default-500 mt-1">
                                                Costo Total: ${payment.servicePrice.toFixed(2)}
                                                {payment.seniaPercent > 0 && ` (Seña: ${payment.seniaPercent}%)`}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            {payment.appointmentDate ? new Date(payment.appointmentDate).toLocaleString() : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {renderStatusBadge(payment.computedPaymentStatus)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                color="primary"
                                                variant="flat"
                                                onClick={() => router.push(`/plataforma/${tenantId}/panel/admin/payments/details/${payment.appointmentId}`)}
                                            >
                                                Ver Detalles
                                            </Button>
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
                                <div key={payment.appointmentId} className="flex flex-col space-y-3">
                                    <div className="flex justify-between items-start">
                                        <Typography variant="h6" color="black">
                                            {payment.patientName || "Paciente Anónimo"}
                                        </Typography>
                                        {renderStatusBadge(payment.computedPaymentStatus)}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col space-y-1 col-span-2">
                                            <Typography variant="p" color="gray" opacity={50}>Servicio</Typography>
                                            <Typography variant="p">{payment.serviceName} (${payment.servicePrice})</Typography>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col space-y-1">
                                            <Typography variant="p" color="gray" opacity={50}>Turno</Typography>
                                            <Typography variant="p" className="text-sm">
                                                {new Date(payment.appointmentDate).toLocaleString()}
                                            </Typography>
                                        </div>
                                        <div className="flex items-end justify-end">
                                            <Button
                                                size="sm"
                                                color="primary"
                                                variant="flat"
                                                onClick={() => router.push(`/plataforma/${tenantId}/panel/admin/payments/details/${payment.appointmentId}`)}
                                            >
                                                Acciones
                                            </Button>
                                        </div>
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