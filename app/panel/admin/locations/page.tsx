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
import { Edit as EditIcon } from "@mui/icons-material";
import { LocationFormDialog } from "../components/LocationFormDialog";
import { PanelHeader } from "../../components/PanelHeader";

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  appointmentCount?: number;
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingLocation, setEditingLocation] = React.useState<Location | null>(null);

  const loadLocations = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/locations");
      if (!res.ok) throw new Error("Failed to load locations");
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const handleCreate = () => {
    setEditingLocation(null);
    setDialogOpen(true);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: { name: string; address: string; phone: string }) => {
    try {
      if (editingLocation) {
        // Update
        const res = await fetch(`/api/admin/locations/${editingLocation.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            address: data.address,
            phone: data.phone || null,
          }),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || "Error al actualizar sede");
        }
      } else {
        // Create
        const res = await fetch("/api/admin/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            address: data.address,
            phone: data.phone || null,
          }),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || "Error al crear sede");
        }
      }
      await loadLocations();
      setDialogOpen(false);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ py: 4 }}>
        <PanelHeader
          title="Sedes"
          action={{
            label: "Crear Sede",
            onClick: handleCreate,
          }}
        />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre del Centro</TableCell>
                <TableCell>Dirección</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell align="right">Citas Asociadas</TableCell>
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
              ) : locations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay sedes registradas
                  </TableCell>
                </TableRow>
              ) : (
                locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>{location.name}</TableCell>
                    <TableCell>{location.address}</TableCell>
                    <TableCell>{location.phone || "-"}</TableCell>
                    <TableCell align="right">
                      {location.appointmentCount ?? 0}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(location)}
                        aria-label="editar"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <LocationFormDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditingLocation(null);
          }}
          onSubmit={handleSubmit}
          mode={editingLocation ? "edit" : "create"}
          initialData={editingLocation || undefined}
        />
      </Box>
    </Container>
  );
}


