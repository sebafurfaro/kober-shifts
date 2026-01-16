"use client";

import * as React from "react";
import {
    Container,
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack,
    TextField,
    InputAdornment,
    CircularProgress,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
    Divider,
} from "@mui/material";
import {
    ExpandMore as ExpandMoreIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from "@mui/icons-material";
import { PanelHeader } from "../../components/PanelHeader";
import { CoverageFormDialog } from "../components/CoverageFormDialog";

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
    const [coverages, setCoverages] = React.useState<Coverage[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");

    // Dialog state
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create");
    const [currentCoverage, setCurrentCoverage] = React.useState<Coverage | undefined>(undefined);
    const [submitting, setSubmitting] = React.useState(false);

    const loadData = React.useCallback(async () => {
        try {
            const res = await fetch("/api/admin/coverages");
            if (!res.ok) throw new Error("Error al cargar las coberturas");
            const data = await res.json();
            setCoverages(data);
        } catch (error) {
            console.error("Error loading coverages:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreate = () => {
        setDialogMode("create");
        setCurrentCoverage(undefined);
        setDialogOpen(true);
    };

    const handleEdit = (coverage: Coverage, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent accordion from toggling
        setDialogMode("edit");
        setCurrentCoverage(coverage);
        setDialogOpen(true);
    };

    const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent accordion from toggling
        if (!window.confirm(`¿Estás seguro de eliminar "${name}"? Se eliminarán todos sus planes asociados.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/coverages/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Error al eliminar");
            await loadData();
        } catch (error) {
            alert("No se pudo eliminar la cobertura");
        }
    };

    const handleSubmit = async (formData: any) => {
        setSubmitting(true);
        try {
            const url = dialogMode === "create"
                ? "/api/admin/coverages"
                : `/api/admin/coverages/${currentCoverage?.id}`;

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
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <PanelHeader
                title="Coberturas"
                subtitle="Carga de coberturas y planes"
                action={{
                    label: "Nueva Cobertura",
                    color: "success",
                    onClick: handleCreate
                }}
            />

            <Box sx={{ mb: 4 }}>
                <TextField
                    fullWidth
                    placeholder="Buscar cobertura o plan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                    size="small"
                />
            </Box>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : filteredCoverages.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", bgcolor: "background.default" }}>
                    <Typography color="text.secondary">
                        {search ? "No se encontraron resultados para tu búsqueda." : "No hay coberturas cargadas."}
                    </Typography>
                </Paper>
            ) : (
                <Stack spacing={1}>
                    {filteredCoverages.map((coverage) => (
                        <Accordion key={coverage.id} disableGutters elevation={0} variant="outlined">
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: "flex", alignItems: "center", width: "100%", pr: 2 }}>
                                    <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>
                                        {coverage.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                                        {coverage.plans.length} planes
                                    </Typography>
                                    <Box sx={{ display: "flex" }}>
                                        <IconButton
                                            component="div"
                                            size="small"
                                            onClick={(e) => handleEdit(coverage, e)}
                                            sx={{ mr: 1 }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            component="div"
                                            size="small"
                                            color="error"
                                            onClick={(e) => handleDelete(coverage.id, coverage.name, e)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ bgcolor: "action.hover", p: 0 }}>
                                <Divider />
                                <List dense>
                                    {coverage.plans.map((plan) => (
                                        <ListItem key={plan.id}>
                                            <ListItemText
                                                primary={plan.name}
                                                primaryTypographyProps={{ variant: "body2" }}
                                            />
                                        </ListItem>
                                    ))}
                                    {coverage.plans.length === 0 && (
                                        <ListItem>
                                            <ListItemText primary="Sin planes registrados" />
                                        </ListItem>
                                    )}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Stack>
            )}

            <CoverageFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleSubmit}
                mode={dialogMode}
                initialData={currentCoverage}
                loading={submitting}
            />
        </Container>
    );
}