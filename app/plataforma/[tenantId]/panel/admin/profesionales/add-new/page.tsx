"use client";

import * as React from "react";
import { Spinner, Alert } from "@heroui/react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PanelHeader } from "../../../components/PanelHeader";
import { ProfessionalForm } from "../components/ProfessionalForm";
import { Specialty } from "../components/types";

export default function ProfessionalAddPage() {
    const router = useRouter();
    const params = useParams();
    const tenantId = params.tenantId as string;
    const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [limitReached, setLimitReached] = React.useState(false);
    const [showSpecialties, setShowSpecialties] = React.useState(true);
    const [showCoverage, setShowCoverage] = React.useState(true);

    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [featuresRes, professionalsRes] = await Promise.all([
                    fetch(`/api/plataforma/${tenantId}/features`, { credentials: "include" }),
                    fetch(`/api/plataforma/${tenantId}/admin/professionals`, { credentials: "include" }),
                ]);
                if (cancelled) return;
                if (featuresRes.ok && professionalsRes.ok) {
                    const features = await featuresRes.json();
                    const professionals = await professionalsRes.json();
                    const maxUsers = typeof features.maxUsers === "number" ? features.maxUsers : 1;
                    const list = Array.isArray(professionals) ? professionals : [];
                    if (list.length >= maxUsers) {
                        setLimitReached(true);
                        return;
                    }
                    setShowSpecialties(features.show_specialties ?? true);
                    setShowCoverage(features.show_coverage ?? true);
                }
            } catch {
                if (!cancelled) setLimitReached(false);
            }
        })();
        return () => { cancelled = true; };
    }, [tenantId]);

    React.useEffect(() => {
        if (limitReached) {
            router.replace(`/plataforma/${tenantId}/panel/admin/profesionales`);
        }
    }, [limitReached, router, tenantId]);

    React.useEffect(() => {
        if (limitReached) return;
        async function loadSpecialties() {
            try {
                const res = await fetch(`/api/plataforma/${tenantId}/admin/specialties`);
                if (!res.ok) throw new Error("Failed to load specialties");
                const data = await res.json();
                setSpecialties(data);
            } catch (error) {
                console.error("Error loading specialties:", error);
            } finally {
                setLoading(false);
            }
        }
        loadSpecialties();
    }, [tenantId, limitReached]);

    const handleSubmit = async (formData: any) => {
        setSubmitting(true);
        setSubmitError(null);

        try {
            const res = await fetch(`/api/plataforma/${tenantId}/admin/professionals`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Error al crear el profesional");
            }

            const data = await res.json();
            router.push(`/plataforma/${tenantId}/panel/admin/profesionales/${data.id}/edit`);
            router.refresh();
        } catch (error: any) {
            setSubmitError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto mt-8 text-center">
                <Spinner size="lg" />
            </div>
        );
    }

    const returnBack = () => {
        router.push(`/plataforma/${tenantId}/panel/admin/profesionales`);
    };

    return (
        <div className="max-w-7xl mx-auto mt-8 mb-16">
            <PanelHeader
                title="Agregar Profesional"
                subtitle="Configura el perfil, especialidades y horarios del nuevo profesional"
                action={{
                    label: "Volver",
                    onClick: returnBack,
                    variant: "bordered",
                    startIcon: <ArrowLeft className="w-4 h-4" />
                }}
            />

            {submitError && (
                <Alert color="danger" className="mt-4 mb-4">
                    {submitError}
                </Alert>
            )}

            <div className="mt-6">
                <ProfessionalForm
                    mode="create"
                    specialties={specialties}
                    onSubmit={handleSubmit}
                    loading={submitting}
                    showSpecialties={showSpecialties}
                    showCoverage={showCoverage}
                />
            </div>
        </div>
    );
}
