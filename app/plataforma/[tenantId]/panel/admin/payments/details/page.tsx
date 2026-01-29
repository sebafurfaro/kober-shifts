"use client";

import { PanelHeader } from "../../../components/PanelHeader";
import { Card, CardBody, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Spinner, Pagination } from "@heroui/react";
import * as React from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

type PaymentRecord = {
    _id: string;
    appointmentId?: string;
    amount?: number;
    status?: string;
    purpose?: string;
    provider?: string;
    createdAt?: string;
};

export default function AdminPaymentsDetailsPage() {
    const params = useParams();
    const tenantId = params.tenantId as string;
    const [records, setRecords] = React.useState<PaymentRecord[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const router = useRouter();
    
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
        <div className="max-w-7xl mx-auto">
            <div className="py-8">
                <PanelHeader
                    title="Historial de pagos"
                    subtitle="Revisa el historial de pagos totales o señas Pagadas"
                    action={{
                        label: "Volver a Pagos",
                        onClick: () => {
                            router.push(`/plataforma/${tenantId}/panel/admin/payments`);
                        },
                    }}
                />
            </div>
            <Card className="mb-8">
                <CardBody className="p-6">
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
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

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
        </div>
    )
}