"use client";

import * as React from "react";
import { Box, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Avatar, Chip, Typography } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { PanelHeader } from "../../components/PanelHeader";
import { useRouter } from "next/navigation";

interface Professional {
  id: string;
  name: string;
  email: string;
  color?: string | null;
  professional?: {
    specialty?: {
      id: string;
      name: string;
    } | null;
    specialties?: Array<{
      id: string;
      name: string;
    }>;
    color?: string | null;
  } | null;
}

export default function AdminProfessionalsPage() {
  const router = useRouter();
  const [professionals, setProfessionals] = React.useState<Professional[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/professionals");
      if (!res.ok) throw new Error("Failed to load professionals");
      const data = await res.json();
      setProfessionals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading professionals:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    router.push("/panel/admin/professionals/add-new");
  };

  const handleEdit = (professional: Professional) => {
    router.push(`/panel/admin/professionals/${professional.id}/edit`);
  };

  const handleDelete = async (professional: Professional) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al profesional ${professional.name}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/professionals/${professional.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Error al eliminar profesional");
      }

      await loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ py: 4 }}>
        <PanelHeader
          title="Profesionales"
          action={{
            label: "Guardar",
            color: "success",
            onClick: handleCreate,
          }}
        />

        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Color</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Especialidades</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : professionals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    No hay profesionales registrados
                  </TableCell>
                </TableRow>
              ) : (
                professionals.map((professional) => {
                  const color = professional.color || professional.professional?.color || "#2196f3";
                  const initials = professional.name
                    .split(" ")
                    .filter(n => n.length > 0)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <TableRow key={professional.id} hover>
                      <TableCell>
                        <Avatar
                          sx={{
                            bgcolor: color,
                            width: 36,
                            height: 36,
                            fontSize: "0.80rem",
                            fontWeight: 600,
                          }}
                        >
                          {initials}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {professional.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {professional.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {professional.professional?.specialties && professional.professional.specialties.length > 0 ? (
                            professional.professional.specialties.map((specialty) => (
                              <Chip
                                key={specialty.id}
                                label={specialty.name}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.7rem", height: "20px" }}
                              />
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Sin especialidad
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(professional)}
                          title="Editar"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(professional)}
                          title="Eliminar"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}
