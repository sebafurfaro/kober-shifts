"use client";

import * as React from "react";
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack,
    TextField,
    InputAdornment,
    CircularProgress,
    Button,
    Switch,
    Divider,
    List,
    ListItem,
    ListItemText,
} from "@mui/material";
import {
    ExpandMore as ExpandMoreIcon,
    Search as SearchIcon,
    Add as AddIcon,
} from "@mui/icons-material";
import { ProfessionalFormData, SelectedCoverage } from "./types";

interface CoveragePlan {
    id: string;
    name: string;
}

interface Coverage {
    id: string;
    name: string;
    plans: CoveragePlan[];
}

interface CoveragesTabProps {
    formData: ProfessionalFormData;
    setFormData: React.Dispatch<React.SetStateAction<ProfessionalFormData>>;
}

export function CoveragesTab({ formData, setFormData }: CoveragesTabProps) {
    const [allCoverages, setAllCoverages] = React.useState<Coverage[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");

    React.useEffect(() => {
        async function fetchCoverages() {
            try {
                const res = await fetch("/api/admin/coverages");
                const data = await res.json();
                setAllCoverages(data);
            } catch (error) {
                console.error("Error fetching coverages:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchCoverages();
    }, []);

    const getSelectedCoverage = (coverageId: string) => {
        return formData.medicalCoverages?.find((c) => c.coverageId === coverageId);
    };

    const toggleCoverage = (coverage: Coverage) => {
        setFormData((prev) => {
            const currentCoverages = prev.medicalCoverages || [];
            const alreadySelected = currentCoverages.some((c) => c.coverageId === coverage.id);

            if (alreadySelected) {
                return {
                    ...prev,
                    medicalCoverages: currentCoverages.filter((c) => c.coverageId !== coverage.id),
                };
            } else {
                const newSelection: SelectedCoverage = {
                    coverageId: coverage.id,
                    plans: coverage.plans.map((p) => ({ planId: p.id, active: true })),
                };
                return {
                    ...prev,
                    medicalCoverages: [...currentCoverages, newSelection],
                };
            }
        });
    };

    const togglePlan = (coverageId: string, planId: string) => {
        setFormData((prev) => {
            const currentCoverages = prev.medicalCoverages || [];
            const newCoverages = currentCoverages.map((c) => {
                if (c.coverageId === coverageId) {
                    return {
                        ...c,
                        plans: c.plans.map((p) => (p.planId === planId ? { ...p, active: !p.active } : p)),
                    };
                }
                return c;
            });
            return { ...prev, medicalCoverages: newCoverages };
        });
    };

    const filteredCoverages = allCoverages.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.plans.some(p => p.name.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar cobertura o plan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <Stack spacing={1}>
                {filteredCoverages.map((coverage) => {
                    const selected = getSelectedCoverage(coverage.id);
                    const activePlansCount = selected?.plans.filter((p) => p.active).length || 0;
                    const totalPlansCount = coverage.plans.length;

                    return (
                        <Accordion key={coverage.id} variant="outlined" disableGutters>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: "flex", alignItems: "center", width: "100%", pr: 2 }}>
                                    <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>
                                        {coverage.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                                        {selected ? `${activePlansCount}/${totalPlansCount}` : totalPlansCount} planes
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant={selected ? "outlined" : "contained"}
                                        color={selected ? "error" : "success"}
                                        startIcon={selected ? null : <AddIcon />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCoverage(coverage);
                                        }}
                                        sx={{ minWidth: 100 }}
                                    >
                                        {selected ? "Quitar" : "Agregar"}
                                    </Button>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ bgcolor: "action.hover", p: 0 }}>
                                {!selected ? (
                                    <Box sx={{ p: 4, textAlign: "center" }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Esta cobertura no está activa para este profesional.
                                        </Typography>
                                        <Button
                                            size="small"
                                            variant="text"
                                            onClick={() => toggleCoverage(coverage)}
                                        >
                                            Habilitar Cobertura
                                        </Button>
                                    </Box>
                                ) : (
                                    <Box>
                                        <Divider />
                                        <List dense sx={{ py: 0 }}>
                                            {coverage.plans.map((plan) => {
                                                const planState = selected.plans.find((p) => p.planId === plan.id);
                                                const isActive = planState?.active ?? false;

                                                return (
                                                    <ListItem
                                                        key={plan.id}
                                                        secondaryAction={
                                                            <Switch
                                                                edge="end"
                                                                checked={isActive}
                                                                onChange={() => togglePlan(coverage.id, plan.id)}
                                                                color="success"
                                                            />
                                                        }
                                                        sx={{
                                                            borderBottom: "1px solid",
                                                            borderColor: "divider",
                                                            "&:last-child": { borderBottom: 0 },
                                                            bgcolor: "background.paper",
                                                            py: 1.5
                                                        }}
                                                    >
                                                        <ListItemText
                                                            primary={plan.name}
                                                            secondary={isActive ? "Incluido" : "No incluido"}
                                                            secondaryTypographyProps={{
                                                                color: isActive ? "success.main" : "text.secondary",
                                                                sx: { fontWeight: isActive ? 600 : 400 }
                                                            }}
                                                        />
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    </Box>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    );
                })}
                {filteredCoverages.length === 0 && (
                    <Box sx={{ p: 4, textAlign: "center", bgcolor: "background.default", borderRadius: 1 }}>
                        <Typography color="text.secondary">
                            No se encontraron coberturas que coincidan con la búsqueda.
                        </Typography>
                    </Box>
                )}
            </Stack>
        </Box>
    );
}
