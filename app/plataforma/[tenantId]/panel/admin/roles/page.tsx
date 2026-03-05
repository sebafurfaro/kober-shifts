"use client";

import * as React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Card, Checkbox, Spinner, Button, Tooltip } from "@heroui/react";
import { PanelHeader } from "../../components/PanelHeader";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { useParams } from "next/navigation";

const PERMISSIONS = [
  { key: "analytics", label: "Analíticas", path: "/analytics" },
  { key: "turnosProfessional", label: "Turnos Profesional", path: "/professional" },
  { key: "patients", label: "Clientes", path: "/patients" },
  { key: "servicios", label: "Servicios", path: "/servicios" },
  { key: "admin", label: "Admin", path: "/admin" },
  { key: "pagos", label: "Pagos", path: "/pagos" },
  { key: "turnos", label: "Turnos", path: "/turnos" },
  { key: "locations", label: "Sedes", path: "/locations" },
  { key: "coberturas", label: "Coberturas", path: "/coberturas" },
  { key: "collaborators", label: "Usuarios", path: "/collaborators" },
  { key: "profesionales", label: "Profesionales", path: "/profesionales" },
] as const;

type RoleKey = "ADMIN" | "PROFESSIONAL" | "SUPERVISOR";

const DEFAULT_PERMISSIONS: Record<string, Record<RoleKey, number>> = {
  analytics: { ADMIN: 1, PROFESSIONAL: 0, SUPERVISOR: 1 },
  turnosProfessional: { ADMIN: 1, PROFESSIONAL: 1, SUPERVISOR: 1 },
  patients: { ADMIN: 1, PROFESSIONAL: 0, SUPERVISOR: 1 },
  servicios: { ADMIN: 1, PROFESSIONAL: 1, SUPERVISOR: 1 },
  admin: { ADMIN: 1, PROFESSIONAL: 0, SUPERVISOR: 0 },
  pagos: { ADMIN: 1, PROFESSIONAL: 0, SUPERVISOR: 1 },
  turnos: { ADMIN: 1, PROFESSIONAL: 1, SUPERVISOR: 1 },
  locations: { ADMIN: 1, PROFESSIONAL: 1, SUPERVISOR: 1 },
  coberturas: { ADMIN: 1, PROFESSIONAL: 1, SUPERVISOR: 1 },
  collaborators: { ADMIN: 1, PROFESSIONAL: 0, SUPERVISOR: 0 },
  profesionales: { ADMIN: 1, PROFESSIONAL: 1, SUPERVISOR: 1 },
};

const COLUMN_TOOLTIPS: Record<string, string> = {
  permission: "Cada fila es una sección del panel. Activa o desactiva el acceso por rol.",
  admin: "Rol con acceso total al negocio. Suele ser el dueño o responsable.",
  professional: "Rol para profesionales que atienden turnos. Acceso a mis turnos y servicios.",
  supervisor: "Rol recepcionista. Acceso a turnos, clientes y cobros, sin configurar el negocio.",
};

export default function AdminRolesPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [permissions, setPermissions] = React.useState<Record<string, Record<RoleKey, number>>>(() => ({ ...DEFAULT_PERMISSIONS }));
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [alert, setAlert] = React.useState<{ open: boolean; message: string; type: "success" | "error" | "warning" }>({ open: false, message: "", type: "success" });

  React.useEffect(() => {
    // TODO: cargar permisos desde API cuando exista
    setLoading(false);
  }, [tenantId]);

  const handleChange = (permKey: string, role: RoleKey, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [permKey]: {
        ...prev[permKey],
        [role]: checked ? 1 : 0,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: llamar a API de persistencia de permisos cuando exista
      await new Promise((r) => setTimeout(r, 400));
      setAlert({ open: true, message: "Los cambios se guardarán cuando la persistencia de permisos esté disponible.", type: "warning" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-8">
      <div className="py-8">
        <PanelHeader
          title="Roles"
          subtitle="Activa o desactiva permisos por rol (1 = activo, 0 = desactivado). Los cambios se replicarán en las secciones y en la base de datos."
        />

        <Card className="card">
          <Table aria-label="Permisos por rol">
            <TableHeader>
              <TableColumn key="permission" className="rounded-tl-lg text-slate-800 text-base">
                <Tooltip content={COLUMN_TOOLTIPS.permission} placement="top">
                  <span className="cursor-help underline decoration-dotted decoration-slate-400">Permiso</span>
                </Tooltip>
              </TableColumn>
              <TableColumn key="admin" className="text-slate-800 text-base">
                <Tooltip content={COLUMN_TOOLTIPS.admin} placement="top">
                  <span className="cursor-help underline decoration-dotted decoration-slate-400">Administrador</span>
                </Tooltip>
              </TableColumn>
              <TableColumn key="professional" className="text-slate-800 text-base">
                <Tooltip content={COLUMN_TOOLTIPS.professional} placement="top">
                  <span className="cursor-help underline decoration-dotted decoration-slate-400">Profesional</span>
                </Tooltip>
              </TableColumn>
              <TableColumn key="supervisor" className="rounded-tr-lg text-slate-800 text-base">
                <Tooltip content={COLUMN_TOOLTIPS.supervisor} placement="top">
                  <span className="cursor-help underline decoration-dotted decoration-slate-400">Recepcionista</span>
                </Tooltip>
              </TableColumn>
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={<Spinner label="Cargando..." />}
              emptyContent={null}
            >
              {PERMISSIONS.map((perm) => (
                <TableRow key={perm.key}>
                  <TableCell>
                    <Tooltip content={`Ruta: ${perm.path}`} placement="right">
                      <span className="text-sm font-medium text-slate-800">{perm.label}</span>
                    </Tooltip>
                    <span className="text-xs text-slate-500 block">{perm.path}</span>
                  </TableCell>
                  <TableCell>
                    <Tooltip content={`${perm.label} como Administrador`} placement="top">
                      <Checkbox
                        isSelected={(permissions[perm.key]?.ADMIN ?? 1) === 1}
                        onValueChange={(checked) => handleChange(perm.key, "ADMIN", checked)}
                        aria-label={`${perm.label} Administrador`}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip content={`${perm.label} como Profesional`} placement="top">
                      <Checkbox
                        isSelected={(permissions[perm.key]?.PROFESSIONAL ?? 0) === 1}
                        onValueChange={(checked) => handleChange(perm.key, "PROFESSIONAL", checked)}
                        aria-label={`${perm.label} Profesional`}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip content={`${perm.label} como Recepcionista`} placement="top">
                      <Checkbox
                        isSelected={(permissions[perm.key]?.SUPERVISOR ?? 0) === 1}
                        onValueChange={(checked) => handleChange(perm.key, "SUPERVISOR", checked)}
                        aria-label={`${perm.label} Recepcionista`}
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 border-t border-gray-200 flex justify-end">
            <Button variant="solid" color="primary" onPress={handleSave} isLoading={saving}>
              Guardar
            </Button>
          </div>
        </Card>

        <AlertDialog
          open={alert.open}
          onClose={() => setAlert((a) => ({ ...a, open: false }))}
          message={alert.message}
          type={alert.type}
        />
      </div>
    </div>
  );
}
