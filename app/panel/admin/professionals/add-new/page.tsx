"use client";

import * as React from "react";
import { Container, CircularProgress, Alert, Box } from "@mui/material";
import { useRouter } from "next/navigation";
import { PanelHeader } from "../../../components/PanelHeader";
import { ProfessionalForm } from "../components/ProfessionalForm";
import { Specialty } from "../components/types";

export default function ProfessionalAddPage() {
    const router = useRouter();
    const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState<string | null>(null);

    React.useEffect(() => {
        async function loadSpecialties() {
            try {
                const res = await fetch("/api/admin/specialties");
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
    }, []);

    const handleSubmit = async (formData: any) => {
        setSubmitting(true);
        setSubmitError(null);

        try {
            const res = await fetch("/api/admin/professionals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Error al crear el profesional");
            }

            router.push("/panel/admin/professionals");
            router.refresh();
        } catch (error: any) {
            setSubmitError(error.message);
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
                title="Agregar Profesional"
                subtitle="Configura el perfil, especialidades y horarios del nuevo profesional"
            />

            {submitError && (
                <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                    {submitError}
                </Alert>
            )}

            <Box sx={{ mt: 4 }}>
                <ProfessionalForm
                    mode="create"
                    specialties={specialties}
                    onSubmit={handleSubmit}
                    loading={submitting}
                />
            </Box>
        </Container>
    );
}