"use client";

import * as React from "react";
import { Spinner, Alert } from "@heroui/react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PanelHeader } from "../../../../components/PanelHeader";
import { ProfessionalForm } from "../../../profesionales/components/ProfessionalForm";
import { Section } from "../../../../components/layout/Section";

export default function ProfessionalEditPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const tenantId = params.tenantId as string;

    const [initialData, setInitialData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [showCoverage, setShowCoverage] = React.useState(true);

    React.useEffect(() => {
        async function loadData() {
            try {
                const [proRes, featuresRes] = await Promise.all([
                    fetch(`/api/plataforma/${tenantId}/admin/professionals/${id}`, { credentials: "include" }),
                    fetch(`/api/plataforma/${tenantId}/features`, { credentials: "include" }),
                ]);

                if (!proRes.ok) throw new Error("Error al cargar datos");

                const pro = await proRes.json();
                if (featuresRes.ok) {
                    const features = await featuresRes.json();
                    setShowCoverage(features.show_coverage ?? true);
                }

                setInitialData({
                    ...pro,
                    medicalCoverages: pro.medicalCoverages || [],
                    availabilityConfig: pro.availabilityConfig || undefined
                });
            } catch (error: any) {
                console.error("Error loading data:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id, tenantId]);

    const handleSubmit = async (formData: any) => {
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/plataforma/${tenantId}/admin/professionals/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Error al actualizar el profesional");
            }

            router.refresh();
        } catch (error: any) {
            setError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Section>
                <Spinner size="lg" />
            </Section>
        );
    }

    return (
        <Section>
            <PanelHeader
                title="Editar Profesional"
                subtitle={`Modificando el perfil de ${initialData?.name}`}
                action={{
                    label: "Volver",
                    onClick: () => router.push(`/plataforma/${tenantId}/panel/admin/collaborators`),
                    variant: "bordered",
                    startIcon: <ArrowLeft className="w-4 h-4" />
                }}
            />

            {error && (
                <Alert color="danger" className="mt-4 mb-4">
                    {error}
                </Alert>
            )}

            <div className="mt-6">
                <ProfessionalForm
                    mode="edit"
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    loading={submitting}
                    showCoverage={showCoverage}
                />
            </div>
        </Section>
    );
}
