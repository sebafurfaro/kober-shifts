"use client";

import * as React from "react";
import {
    Accordion,
    AccordionItem,
    Input,
    Spinner,
    Button,
    Card,
    CardBody,
} from "@heroui/react";
import {
    Search,
    Pencil,
    Trash2,
} from "lucide-react";
import { PanelHeader } from "../../components/PanelHeader";
import { CoverageFormDialog } from "../components/CoverageFormDialog";
import { ConfirmationDialog } from "../../components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { useParams } from "next/navigation";

interface Plan {
    id: string;
    name: string;
}

interface Coverage {
    id: string;
    name: string;
    plans: Plan[];
}

export default function CoveragesPage() {
    const params = useParams();
    const tenantId = params.tenantId as string;
    const [coverages, setCoverages] = React.useState<Coverage[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");

    // Dialog state
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create");
    const [currentCoverage, setCurrentCoverage] = React.useState<Coverage | undefined>(undefined);
    const [submitting, setSubmitting] = React.useState(false);
    const [confirmationDialog, setConfirmationDialog] = React.useState<{
      open: boolean;
      message: string;
      onConfirm: () => void;
    }>({
      open: false,
      message: "",
      onConfirm: () => {},
    });
    const [alertDialog, setAlertDialog] = React.useState<{
      open: boolean;
      message: string;
      type: "error" | "info" | "success" | "warning";
    }>({ open: false, message: "", type: "error" });

    const loadData = React.useCallback(async () => {
        try {
            const res = await fetch(`/api/plataforma/${tenantId}/admin/coverages`);
            if (!res.ok) throw new Error("Error al cargar las coberturas");
            const data = await res.json();
            setCoverages(data);
        } catch (error) {
            console.error("Error loading coverages:", error);
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreate = () => {
        setDialogMode("create");
        setCurrentCoverage(undefined);
        setDialogOpen(true);
    };

    const handleEdit = (coverage: Coverage) => {
        setDialogMode("edit");
        setCurrentCoverage(coverage);
        setDialogOpen(true);
    };

    const handleDelete = (id: string, name: string) => {
        setConfirmationDialog({
          open: true,
          message: `¿Estás seguro de eliminar "${name}"? Se eliminarán todos sus planes asociados.`,
          onConfirm: async () => {
            try {
              const res = await fetch(`/api/plataforma/${tenantId}/admin/coverages/${id}`, { method: "DELETE" });
              if (!res.ok) throw new Error("Error al eliminar");
              await loadData();
            } catch (error) {
              setAlertDialog({
                open: true,
                message: "No se pudo eliminar la cobertura",
                type: "error",
              });
            }
          },
        });
    };

    const handleSubmit = async (formData: any) => {
        setSubmitting(true);
        try {
            const url = dialogMode === "create"
                ? `/api/plataforma/${tenantId}/admin/coverages`
                : `/api/plataforma/${tenantId}/admin/coverages/${currentCoverage?.id}`;

            const res = await fetch(url, {
                method: dialogMode === "create" ? "POST" : "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    plans: formData.plans
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Error al guardar");
            }

            await loadData();
            setDialogOpen(false);
        } catch (error: any) {
            throw error;
        } finally {
            setSubmitting(false);
        }
    };

    const filteredCoverages = React.useMemo(() => {
        const query = search.toLowerCase().trim();
        if (!query) return coverages;

        return coverages.filter((c) => {
            const matchesName = c.name.toLowerCase().includes(query);
            const matchesPlan = c.plans.some((p) => p.name.toLowerCase().includes(query));
            return matchesName || matchesPlan;
        });
    }, [coverages, search]);

    return (
        <div className="max-w-7xl mx-auto mt-8 mb-8 px-4">
            <PanelHeader
                title="Coberturas"
                subtitle="Carga de coberturas y planes"
                action={{
                    label: "Nueva Cobertura",
                    onClick: handleCreate
                }}
            />
            <Card className="card">
                <CardBody className="p-0">
                    <Input
                        placeholder="Buscar cobertura o plan..."
                        value={search}
                        onValueChange={setSearch}
                        startContent={<Search className="w-4 h-4 text-gray-400" />}
                        size="sm"
                        classNames={{
                            base: "mb-4",
                            inputWrapper: "h-11 border-2 border-gray-200 bg-white focus-within:ring-0 focus-within:outline-none",
                            input: "px-4 text-sm text-gray-800 focus:outline-none focus:ring-0",
                        }}
                    />

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Spinner size="lg" />
                        </div>
                    ) : filteredCoverages.length === 0 ? (
                        <Card className="p-8 text-center bg-transparent">
                            <CardBody>
                                <p className="text-sm text-gray-600">
                                    {search ? "No se encontraron resultados para tu búsqueda." : "No hay coberturas cargadas."}
                                </p>
                            </CardBody>
                        </Card>
                    ) : (
                        <Accordion variant="splitted" className="w-full mt-4 space-y-2">
                            {filteredCoverages.map((coverage) => (
                                <AccordionItem
                                    key={coverage.id}
                                    aria-label={coverage.name}
                                    classNames={{
                                        base: "border-[1px] border-gray-200 rounded-lg px-0 shadow-none",
                                        indicator: "mr-4",
                                    }}
                                    title={
                                        <div className="flex items-center justify-between w-full pl-4">
                                            <span className="font-semibold flex-1 text-left text-slate-800">{coverage.name}</span>
                                            <span className="text-xs text-gray-500 mr-4">
                                                {coverage.plans.length} planes
                                            </span>
                                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onPress={() => handleEdit(coverage)}
                                                >
                                                    <Pencil className="w-4 h-4 text-blue-500" />
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    color="danger"
                                                    onPress={() => handleDelete(coverage.id, coverage.name)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    }
                                >
                                    <div className="bg-gray-50 p-0">
                                        <div className="border-t border-gray-200">
                                            <div className="flex flex-col">
                                                {coverage.plans.map((plan) => (
                                                    <div key={plan.id} className="px-4 py-2 border-b border-gray-100 last:border-b-0">
                                                        <p className="text-sm text-gray-900">{plan.name}</p>
                                                    </div>
                                                ))}
                                                {coverage.plans.length === 0 && (
                                                    <div className="px-4 py-2">
                                                        <p className="text-sm text-gray-500">Sin planes registrados</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardBody>
            </Card>



            <CoverageFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleSubmit}
                mode={dialogMode}
                initialData={currentCoverage}
                loading={submitting}
            />

            <ConfirmationDialog
              open={confirmationDialog.open}
              onClose={() => setConfirmationDialog({ ...confirmationDialog, open: false })}
              onConfirm={confirmationDialog.onConfirm}
              message={confirmationDialog.message}
              title="Eliminar Cobertura"
              confirmText="Eliminar"
              cancelText="Cancelar"
              type="warning"
            />

            <AlertDialog
              open={alertDialog.open}
              onClose={() => setAlertDialog({ open: false, message: "", type: "error" })}
              message={alertDialog.message}
              type={alertDialog.type}
            />
        </div>
    );
}