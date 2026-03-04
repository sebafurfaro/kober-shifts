"use client";

import * as React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Card, Checkbox, Spinner } from "@heroui/react";
import { PanelHeader } from "../../components/PanelHeader";
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

export default function AdminRolesPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [permissions, setPermissions] = React.useState<Record<string, Record<RoleKey, number>>>(() => ({ ...DEFAULT_PERMISSIONS }));
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // TODO: cargar permisos desde API/contexto cuando exista
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
    // TODO: persistir en API y contexto
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
              <TableColumn key="permission" className="rounded-tl-lg text-slate-800 text-base">Permiso</TableColumn>
              <TableColumn key="admin" className="text-slate-800 text-base">Administrador</TableColumn>
              <TableColumn key="professional" className="text-slate-800 text-base">Profesional</TableColumn>
              <TableColumn key="supervisor" className="rounded-tr-lg text-slate-800 text-base">Recepcionista</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={<Spinner label="Cargando..." />}
              emptyContent={null}
            >
              {PERMISSIONS.map((perm) => (
                <TableRow key={perm.key}>
                  <TableCell>
                    <span className="text-sm font-medium text-slate-800">{perm.label}</span>
                    <span className="text-xs text-slate-500 block">{perm.path}</span>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      isSelected={(permissions[perm.key]?.ADMIN ?? 1) === 1}
                      onValueChange={(checked) => handleChange(perm.key, "ADMIN", checked)}
                      aria-label={`${perm.label} Administrador`}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      isSelected={(permissions[perm.key]?.PROFESSIONAL ?? 0) === 1}
                      onValueChange={(checked) => handleChange(perm.key, "PROFESSIONAL", checked)}
                      aria-label={`${perm.label} Profesional`}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      isSelected={(permissions[perm.key]?.SUPERVISOR ?? 0) === 1}
                      onValueChange={(checked) => handleChange(perm.key, "SUPERVISOR", checked)}
                      aria-label={`${perm.label} Recepcionista`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
