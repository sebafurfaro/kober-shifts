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
  Chip,
  Typography,
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon, Logout as LogoutIcon } from "@mui/icons-material";
import { ConfirmationDialog } from "../../plataforma/[tenantId]/panel/components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../plataforma/[tenantId]/panel/components/alerts/AlertDialog";
import { TenantFormDialog } from "../components/TenantFormDialog";
import { useRouter } from "next/navigation";

interface Tenant {
  id: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function StoreTenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmationDialog, setConfirmationDialog] = React.useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    message: "",
    onConfirm: () => {},
  });
  const [alertDialog, setAlertDialog] = React.useState<{
    open: boolean;
    message: string;
    type: "error" | "info" | "success" | "warning";
  }>({ open: false, message: "", type: "error" });

  const loadTenants = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/store/tenants`, {
        credentials: "include", // Important: include cookies
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/store/login";
          return;
        }
        throw new Error("Failed to load tenants");
      }
      const data = await res.json();
      setTenants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading tenants:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const handleCreate = () => {
    setDialogOpen(true);
  };

  const handleDelete = (tenant: Tenant) => {
    setConfirmationDialog({
      open: true,
      message: `¿Estás seguro de que deseas eliminar el tenant "${tenant.name}" (${tenant.id})? Esta acción eliminará todos los datos asociados y no se puede deshacer.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/store/tenants/${tenant.id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || "Error al eliminar tenant");
          }
          await loadTenants();
        } catch (error: any) {
          setAlertDialog({
            open: true,
            message: error.message || "Error al eliminar tenant",
            type: "error",
          });
        }
      },
    });
  };

  const handleSubmit = async (data: { name: string; id?: string; logoUrl?: string }) => {
    try {
      const res = await fetch(`/api/store/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Error al crear tenant");
      }
      await loadTenants();
      setDialogOpen(false);
    } catch (error: any) {
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/store/auth/logout", { method: "POST" });
      router.push("/store/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      router.push("/store/login");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }} elevation={8}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ fontSize: "1.25rem" }}>
                Gestión de Tenants
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Administra los tenants de la plataforma
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                color="primary"
                onClick={handleCreate}
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                }}
                title="Agregar tenant"
              >
                <AddIcon />
              </IconButton>
              <IconButton
                color="error"
                onClick={handleLogout}
                sx={{
                  bgcolor: "error.main",
                  color: "white",
                  "&:hover": {
                    bgcolor: "error.dark",
                  },
                }}
                title="Cerrar sesión"
              >
                <LogoutIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Fecha de Creación</TableCell>
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
              ) : tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay tenants registrados
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <code style={{ fontSize: "0.875rem" }}>{tenant.id}</code>
                    </TableCell>
                    <TableCell>{tenant.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.isActive ? "Activo" : "Inactivo"}
                        color={tenant.isActive ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(tenant.createdAt).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(tenant)}
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

        <TenantFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
        />

        <ConfirmationDialog
          open={confirmationDialog.open}
          onClose={() => setConfirmationDialog({ ...confirmationDialog, open: false })}
          onConfirm={confirmationDialog.onConfirm}
          message={confirmationDialog.message}
          title="Eliminar Tenant"
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
      </Box>
    </Container>
  );
}
