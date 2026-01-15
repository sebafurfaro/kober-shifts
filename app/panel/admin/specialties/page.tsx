"use client";

import * as React from "react";
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { SpecialtyFormDialog } from "../components/SpecialtyFormDialog";
import { ConfirmationDialog } from "../../components/alerts/ConfirmationDialog";
import { PanelHeader } from "../../components/PanelHeader";

interface Specialty {
  id: string;
  name: string;
  professionalCount?: number;
}

export default function AdminSpecialtiesPage() {
  const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingSpecialty, setEditingSpecialty] = React.useState<Specialty | null>(null);
  const [confirmationDialog, setConfirmationDialog] = React.useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    message: "",
    onConfirm: () => {},
  });

  const loadSpecialties = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/specialties");
      if (!res.ok) throw new Error("Failed to load specialties");
      const data = await res.json();
      setSpecialties(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading specialties:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSpecialties();
  }, [loadSpecialties]);

  const handleCreate = () => {
    setEditingSpecialty(null);
    setDialogOpen(true);
  };

  const handleEdit = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setDialogOpen(true);
  };

  const handleDelete = (specialty: Specialty) => {
    setConfirmationDialog({
      open: true,
      message: `¿Estás seguro de que deseas eliminar la especialidad "${specialty.name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/specialties/${specialty.id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || "Error al eliminar especialidad");
          }
          await loadSpecialties();
        } catch (error: any) {
          alert(error.message || "Error al eliminar especialidad");
        }
      },
    });
  };

  const handleSubmit = async (data: { name: string }) => {
    try {
      if (editingSpecialty) {
        // Update
        const res = await fetch(`/api/admin/specialties/${editingSpecialty.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || "Error al actualizar especialidad");
        }
      } else {
        // Create
        const res = await fetch("/api/admin/specialties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || "Error al crear especialidad");
        }
      }
      await loadSpecialties();
      setDialogOpen(false);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ py: 4 }}>
        <PanelHeader
          title="Especialidades"
          action={{
            label: "Agregar Especialidad",
            onClick: handleCreate,
          }}
        />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell align="right">Profesionales Asociados</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : specialties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No hay especialidades registradas
                  </TableCell>
                </TableRow>
              ) : (
                specialties.map((specialty) => (
                  <TableRow key={specialty.id}>
                    <TableCell>{specialty.name}</TableCell>
                    <TableCell align="right">
                      {specialty.professionalCount ?? 0}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(specialty)}
                          aria-label="editar"
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(specialty)}
                          aria-label="eliminar"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <SpecialtyFormDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditingSpecialty(null);
          }}
          onSubmit={handleSubmit}
          mode={editingSpecialty ? "edit" : "create"}
          initialData={editingSpecialty || undefined}
        />

        <ConfirmationDialog
          open={confirmationDialog.open}
          onClose={() => setConfirmationDialog({ ...confirmationDialog, open: false })}
          onConfirm={confirmationDialog.onConfirm}
          message={confirmationDialog.message}
          title="Eliminar Especialidad"
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="warning"
        />
      </Box>
    </Container>
  );
}


