"use client";

import * as React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Alert,
} from "@heroui/react";
import { Trash2, Plus } from "lucide-react";

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
        <Modal isOpen={open} onClose={onClose} size="md" scrollBehavior="inside">
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader className="text-slate-800">
                        {mode === "create" ? "Crear Cobertura Médica" : "Editar Cobertura Médica"}
                    </ModalHeader>
                    <ModalBody className="text-slate-800">
                        <div className="flex flex-col gap-6">
                            {submitError && (
                                <Alert color="danger" onClose={() => setSubmitError(null)}>
                                    {submitError}
                                </Alert>
                            )}

                            <Input
                                label="Nombre de cobertura"
                                value={formData.name}
                                onValueChange={(value) => {
                                    setFormData((prev) => ({ ...prev, name: value }));
                                    if (errors.name) {
                                        setErrors((prev) => ({ ...prev, name: undefined }));
                                    }
                                }}
                                isInvalid={!!errors.name}
                                errorMessage={errors.name}
                                isRequired
                                isDisabled={loading}
                                autoFocus
                                autoComplete="off"
                            />

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white px-2 text-xs text-gray-500">PLANES</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                {formData.plans.map((plan, index) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        <Input
                                            label={`Título del plan ${index + 1}`}
                                            value={plan.name}
                                            onValueChange={(value) => handlePlanChange(index, value)}
                                            isInvalid={!!errors[`plan_${index}`]}
                                            errorMessage={errors[`plan_${index}`]}
                                            isRequired
                                            isDisabled={loading}
                                            size="sm"
                                            autoComplete="off"
                                            className="flex-1"
                                        />
                                        <Button
                                            isIconOnly
                                            color="danger"
                                            variant="light"
                                            onPress={() => removePlan(index)}
                                            isDisabled={loading || formData.plans.length <= 1}
                                            className="mt-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}

                                <Button
                                    startContent={<Plus className="w-4 h-4" />}
                                    onPress={addPlan}
                                    isDisabled={loading}
                                    variant="flat"
                                    size="sm"
                                    className="self-start button-secondary"
                                >
                                    Agregar Plan
                                </Button>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="light"
                            onPress={onClose}
                            isDisabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            color="primary"
                            isDisabled={loading}
                            isLoading={loading}
                        >
                            {loading ? "Guardando..." : mode === "create" ? "Crear" : "Guardar"}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
}
