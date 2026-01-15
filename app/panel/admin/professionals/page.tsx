"use client";

import * as React from "react";
import { Box, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Avatar, Chip } from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import { UserFormDialog } from "../components/UserFormDialog";
import { PanelHeader } from "../../components/PanelHeader";

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

interface Specialty {
  id: string;
  name: string;
}

export default function AdminProfessionalsPage() {
  const [professionals, setProfessionals] = React.useState<Professional[]>([]);
  const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingProfessional, setEditingProfessional] = React.useState<Professional | null>(null);
  const [dialogLoading, setDialogLoading] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      const [professionalsRes, specialtiesRes] = await Promise.all([
        fetch("/api/admin/professionals"),
        fetch("/api/admin/specialties"),
      ]);

      if (!professionalsRes.ok) throw new Error("Failed to load professionals");
      if (!specialtiesRes.ok) throw new Error("Failed to load specialties");

      const professionalsData = await professionalsRes.json();
      const specialtiesData = await specialtiesRes.json();

      setProfessionals(Array.isArray(professionalsData) ? professionalsData : []);
      setSpecialties(Array.isArray(specialtiesData) ? specialtiesData : []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = () => {
    setEditingProfessional(null);
    setDialogOpen(true);
  };

  const handleEdit = async (professional: Professional) => {
    try {
      // Load full professional data including specialty and color
      const res = await fetch(`/api/admin/professionals/${professional.id}`);
      if (!res.ok) throw new Error("Failed to load professional");
      const data = await res.json();
      // Store specialtyIds in a way that can be accessed later
      setEditingProfessional({ ...professional, ...data, specialtyIds: data.specialtyIds || [] });
      setDialogOpen(true);
    } catch (error) {
      console.error("Error loading professional:", error);
    }
  };

  const handleSubmit = async (data: { name: string; email: string; specialtyId?: string; specialtyIds?: string[]; tempPassword?: string; color?: string; availableDays?: number[]; availableHours?: { start: string; end: string } }) => {
    setDialogLoading(true);
    try {
      if (editingProfessional) {
        // Update
        const res = await fetch(`/api/admin/professionals/${editingProfessional.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || "Error al actualizar profesional");
        }
      } else {
        // Create
        const res = await fetch("/api/admin/professionals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || "Error al crear profesional");
        }
      }
      await loadData();
      setDialogOpen(false);
      setEditingProfessional(null);
    } catch (error: any) {
      throw error;
    } finally {
      setDialogLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ py: 4 }}>
        <PanelHeader
          title="Profesionales"
          action={{
            label: "Agregar Profesional",
            onClick: handleCreate,
          }}
        />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Color</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Especialidad</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : professionals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay profesionales registrados
                  </TableCell>
                </TableRow>
              ) : (
                professionals.map((professional) => {
                  const color = professional.color || professional.professional?.color || "#2196f3";
                  const initials = professional.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  
                  return (
                    <TableRow key={professional.id}>
                      <TableCell>
                        <Avatar
                          sx={{
                            bgcolor: color,
                            width: 40,
                            height: 40,
                            fontSize: "0.875rem",
                            fontWeight: 600,
                          }}
                        >
                          {initials}
                        </Avatar>
                      </TableCell>
                      <TableCell>{professional.name}</TableCell>
                      <TableCell>{professional.email}</TableCell>
                      <TableCell>
                        {professional.professional?.specialties && professional.professional.specialties.length > 0 ? (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                            {professional.professional.specialties.map((specialty) => (
                              <Chip
                                key={specialty.id}
                                label={specialty.name}
                                size="small"
                                sx={{ fontSize: "0.75rem" }}
                              />
                            ))}
                          </Box>
                        ) : professional.professional?.specialty ? (
                          <Chip
                            label={professional.professional.specialty.name}
                            size="small"
                            sx={{ fontSize: "0.75rem" }}
                          />
                        ) : (
                          "Sin especialidad"
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(professional)}
                          aria-label="editar"
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <UserFormDialog
          open={dialogOpen}
          onClose={() => {
            if (!dialogLoading) {
              setDialogOpen(false);
              setEditingProfessional(null);
            }
          }}
          onSubmit={handleSubmit}
          mode={editingProfessional ? "edit" : "create"}
          userType="professional"
          initialData={
            editingProfessional
              ? {
                  id: editingProfessional.id,
                  name: editingProfessional.name,
                  email: editingProfessional.email,
                  specialtyId: editingProfessional.professional?.specialty?.id,
                  specialtyIds: (editingProfessional as any).specialtyIds || 
                    (editingProfessional.professional?.specialties && editingProfessional.professional.specialties.length > 0
                      ? editingProfessional.professional.specialties.map(s => s.id)
                      : editingProfessional.professional?.specialty?.id 
                        ? [editingProfessional.professional.specialty.id] 
                        : []),
                  color: editingProfessional.color || editingProfessional.professional?.color || undefined,
                  availableDays: (editingProfessional as any).availableDays || editingProfessional.professional?.availableDays || undefined,
                  availableHours: (editingProfessional as any).availableHours || editingProfessional.professional?.availableHours || undefined,
                }
              : undefined
          }
          specialties={specialties}
          loading={dialogLoading}
        />
      </Box>
    </Container>
  );
}


