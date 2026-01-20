"use client";

import * as React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Alert,
    CircularProgress,
    IconButton,
    Typography,
    Stack,
    Divider,
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";

interface PlanData {
    id?: string;
    name: string;
}

interface CoverageFormData {
    name: string;
    plans: PlanData[];
}

interface CoverageFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CoverageFormData) => Promise<void>;
    mode: "create" | "edit";
    initialData?: {
        id?: string;
        name?: string;
        plans?: PlanData[];
    };
    loading?: boolean;
}

export function CoverageFormDialog({
    open,
    onClose,
    onSubmit,
    mode,
    initialData,
    loading = false,
}: CoverageFormDialogProps) {
    const [formData, setFormData] = React.useState<CoverageFormData>({
        name: "",
        plans: [{ name: "" }],
    });

    const [errors, setErrors] = React.useState<Partial<Record<string, string>>>({});
    const [submitError, setSubmitError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            setFormData({
                name: initialData?.name || "",
                plans: initialData?.plans && initialData.plans.length > 0
                    ? initialData.plans.map(p => ({ ...p }))
                    : [{ name: "" }],
            });
            setErrors({});
            setSubmitError(null);
        }
    }, [open, initialData]);

    const validate = (): boolean => {
        const newErrors: Partial<Record<string, string>> = {};

        if (!formData.name.trim()) {
            newErrors.name = "El nombre de la cobertura es requerido";
        }

        formData.plans.forEach((plan, index) => {
            if (!plan.name.trim()) {
                newErrors[`plan_${index}`] = "El nombre del plan no puede estar vacío";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setSubmitError(null);
        try {
            await onSubmit({
                name: formData.name.trim(),
                plans: formData.plans.map(p => ({ ...p, name: p.name.trim() })),
            });
            onClose();
        } catch (error: any) {
            setSubmitError(error?.message || "Error al guardar");
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, name: e.target.value }));
        if (errors.name) {
            setErrors((prev) => ({ ...prev, name: undefined }));
        }
    };

    const handlePlanChange = (index: number, value: string) => {
        const newPlans = [...formData.plans];
        newPlans[index].name = value;
        setFormData((prev) => ({ ...prev, plans: newPlans }));

        if (errors[`plan_${index}`]) {
            setErrors((prev) => ({ ...prev, [`plan_${index}`]: undefined }));
        }
    };

    const addPlan = () => {
        setFormData((prev) => ({
            ...prev,
            plans: [...prev.plans, { name: "" }],
        }));
    };

    const removePlan = (index: number) => {
        if (formData.plans.length <= 1) return;
        const newPlans = formData.plans.filter((_, i) => i !== index);
        setFormData((prev) => ({ ...prev, plans: newPlans }));

        // Cleanup errors
        const newErrors = { ...errors };
        delete newErrors[`plan_${index}`];
        setErrors(newErrors);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>
                    {mode === "create" ? "Crear Cobertura Médica" : "Editar Cobertura Médica"}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
                        {submitError && (
                            <Alert severity="error" onClose={() => setSubmitError(null)}>
                                {submitError}
                            </Alert>
                        )}

                        <TextField
                            label="Nombre de cobertura"
                            value={formData.name}
                            onChange={handleNameChange}
                            error={!!errors.name}
                            helperText={errors.name}
                            required
                            disabled={loading}
                            fullWidth
                            autoFocus
                            autoComplete="off"
                        />

                        <Divider>
                            <Typography variant="caption" color="text.secondary">
                                PLANES
                            </Typography>
                        </Divider>

                        <Stack spacing={2}>
                            {formData.plans.map((plan, index) => (
                                <Box key={index} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                                    <TextField
                                        label={`Título del plan ${index + 1}`}
                                        value={plan.name}
                                        onChange={(e) => handlePlanChange(index, e.target.value)}
                                        error={!!errors[`plan_${index}`]}
                                        helperText={errors[`plan_${index}`]}
                                        required
                                        disabled={loading}
                                        fullWidth
                                        size="small"
                                        autoComplete="off"
                                    />
                                    <IconButton
                                        color="error"
                                        onClick={() => removePlan(index)}
                                        disabled={loading || formData.plans.length <= 1}
                                        sx={{ mt: 0.5 }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            ))}

                            <Button
                                startIcon={<AddIcon />}
                                onClick={addPlan}
                                disabled={loading}
                                variant="outlined"
                                size="small"
                                sx={{ alignSelf: "flex-start" }}
                            >
                                Agregar Plan
                            </Button>
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : null}
                    >
                        {loading ? "Guardando..." : mode === "create" ? "Crear" : "Guardar"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
