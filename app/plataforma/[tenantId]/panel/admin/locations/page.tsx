"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Card,
  CardBody,
  Spinner,
} from "@heroui/react";
import { Pencil, Trash2 } from "lucide-react";
import { LocationFormDialog } from "../components/LocationFormDialog";
import { PanelHeader } from "../../components/PanelHeader";
import { ConfirmationDialog } from "../../components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { useParams } from "next/navigation";

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  appointmentCount?: number;
}

export default function AdminLocationsPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingLocation, setEditingLocation] = React.useState<Location | null>(null);
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; location: Location | null }>({
    open: false,
    location: null,
  });
  const [alertDialog, setAlertDialog] = React.useState<{ open: boolean; message: string; type: "error" | "success" }>({
    open: false,
    message: "",
    type: "error",
  });

  const loadLocations = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/locations`);
      if (!res.ok) throw new Error("Failed to load locations");
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

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

  const handleDelete = (location: Location) => {
    setDeleteDialog({ open: true, location });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.location) return;

    try {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/locations/${deleteDialog.location.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Error al eliminar sede");
      }
      await loadLocations();
      setDeleteDialog({ open: false, location: null });
      setAlertDialog({ open: true, message: "Sede eliminada correctamente", type: "success" });
    } catch (error: any) {
      setAlertDialog({ open: true, message: error?.message || "Error al eliminar sede", type: "error" });
    }
  };

  const handleSubmit = async (data: {
    name: string;
    address: string;
    street: string;
    streetNumber: string;
    floor: string;
    apartment: string;
    postalCode: string;
    country: string;
    province: string;
    neighborhood: string;
    phone: string;
  }) => {
    try {
      if (editingLocation) {
        // Update
        const res = await fetch(`/api/plataforma/${tenantId}/admin/locations/${editingLocation.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            address: data.address,
            street: data.street || null,
            streetNumber: data.streetNumber || null,
            floor: data.floor || null,
            apartment: data.apartment || null,
            postalCode: data.postalCode || null,
            country: data.country || null,
            province: data.province || null,
            neighborhood: data.neighborhood || null,
            phone: data.phone || null,
          }),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || "Error al actualizar sede");
        }
      } else {
        // Create
        const res = await fetch(`/api/plataforma/${tenantId}/admin/locations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            address: data.address,
            street: data.street || null,
            streetNumber: data.streetNumber || null,
            floor: data.floor || null,
            apartment: data.apartment || null,
            postalCode: data.postalCode || null,
            country: data.country || null,
            province: data.province || null,
            neighborhood: data.neighborhood || null,
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
    <div className="max-w-7xl mx-auto mt-8 px-4">
      <div className="py-8">
        <PanelHeader
          title="Sedes"
          subtitle="Configura todas las sedes que tengas asociadas"
          action={{
            label: "Crear Sede",
            onClick: handleCreate,
          }}
        />

        <Card>
          <CardBody className="p-0">
            <Table aria-label="Tabla de sedes" className="text-slate-800">
              <TableHeader>
                <TableColumn>Nombre del Centro</TableColumn>
                <TableColumn>Dirección</TableColumn>
                <TableColumn>Teléfono</TableColumn>
                <TableColumn align="end">Citas Asociadas</TableColumn>
                <TableColumn align="end">Acciones</TableColumn>
              </TableHeader>
              <TableBody
                isLoading={loading}
                loadingContent={<Spinner />}
                emptyContent={
                  loading ? "Cargando..." : "No hay sedes registradas"
                }
              >
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>{location.name}</TableCell>
                    <TableCell>{location.address}</TableCell>
                    <TableCell>{location.phone || "-"}</TableCell>
                    <TableCell className="text-right">
                      {location.appointmentCount ?? 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleEdit(location)}
                          aria-label="editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleDelete(location)}
                          aria-label="eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

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

        <ConfirmationDialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, location: null })}
          onConfirm={confirmDelete}
          title="Eliminar Sede"
          message={
            deleteDialog.location
              ? `¿Estás seguro de que deseas eliminar la sede "${deleteDialog.location.name}"? Esta acción no se puede deshacer.`
              : ""
          }
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="warning"
        />

        <AlertDialog
          open={alertDialog.open}
          onClose={() => setAlertDialog({ open: false, message: "", type: "error" })}
          message={alertDialog.message}
          type={alertDialog.type}
        />
      </div>
    </div>
  );
}


