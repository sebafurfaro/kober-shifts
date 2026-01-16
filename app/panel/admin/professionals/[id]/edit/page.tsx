"use client";

import * as React from "react";
import { Container, CircularProgress, Alert, Box } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { PanelHeader } from "../../../../components/PanelHeader";
import { ProfessionalForm } from "../../components/ProfessionalForm";
import { Specialty } from "../../components/types";

export default function ProfessionalEditPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
    const [initialData, setInitialData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        async function loadData() {
            try {
                const [specRes, proRes] = await Promise.all([
                    fetch("/api/admin/specialties"),
                    fetch(`/api/admin/professionals/${id}`)
                ]);

                if (!specRes.ok || !proRes.ok) throw new Error("Error al cargar datos");

                const specs = await specRes.json();
                const pro = await proRes.json();

                setSpecialties(specs);
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
    }, [id]);

    const handleSubmit = async (formData: any) => {
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/professionals/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Error al actualizar el profesional");
            }

            router.push("/panel/admin/professionals");
            router.refresh();
        } catch (error: any) {
            setError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, textAlign: "center" }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
            <PanelHeader
                title="Editar Profesional"
                subtitle={`Modificando el perfil de ${initialData?.name}`}
            />

            {error && (
                <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ mt: 4 }}>
                <ProfessionalForm
                    mode="edit"
                    specialties={specialties}
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    loading={submitting}
                />
            </Box>
        </Container>
    );
}
