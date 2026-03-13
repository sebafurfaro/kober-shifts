"use client";

import * as React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Card, Checkbox, Spinner, Button, Tooltip } from "@heroui/react";
import { PanelHeader } from "../../components/PanelHeader";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { useParams } from "next/navigation";
import { Section } from "../../components/layout/Section";
import { DEFAULT_PERMISSIONS, type RoleKey } from "@/lib/panel-permissions";

const PERMISSIONS = [
  { key: "analytics", label: "Analíticas", path: "/analytics", text: "Acceso a la sección de métricas" },
  { key: "turnosProfessional", label: "Turnos Profesional", path: "/professional", text: "Acceso a la sección de turnos para profesionales" },
  { key: "patients", label: "Clientes", path: "/patients", text: "Acceso a la sección de clientes" },
  { key: "servicios", label: "Añadir Servicios", path: "/servicios", text: "Acceso a la sección de servicios con/sin señas" },
  { key: "admin", label: "Admin", path: "/admin", text: "Acceso a la sección de configuración del negocio" },
  { key: "pagos", label: "Pagos", path: "/pagos", text: "Acceso a la sección de historial de pagos" },
  { key: "turnos", label: "Turnos", path: "/turnos", text: "Acceso a la sección de listado de turnos" },
  { key: "locations", label: "Añadir Sedes", path: "/locations", text: "Acceso a la sección de sedes" },
  { key: "coberturas", label: "Coberturas", path: "/coberturas", text: "Acceso a la sección de coberturas medicas" },
  { key: "collaborators", label: "Añadir Colaboradores", path: "/collaborators", text: "Acceso a la sección de colaboradores" },
  { key: "profesionales", label: "Añadir Profesionales", path: "/profesionales", text: "Acceso a la sección de profesionales" },
] as const;

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
  const [currentUserRole, setCurrentUserRole] = React.useState<RoleKey | null>(null);
  const [features, setFeatures] = React.useState<{ show_pagos?: boolean; show_servicios?: boolean } | null>(null);
  const [alert, setAlert] = React.useState<{ open: boolean; message: string; type: "success" | "error" | "warning" }>({ open: false, message: "", type: "success" });

  /** El admin no puede modificar la columna Administrador (sus propios permisos). */
  const isAdminColumnDisabled = currentUserRole === "ADMIN";

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/plataforma/${tenantId}/auth/me`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/plataforma/${tenantId}/admin/permissions`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/plataforma/${tenantId}/features`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([meData, permData, featureData]) => {
        if (cancelled) return;
        if (meData?.role === "ADMIN" || meData?.role === "PROFESSIONAL" || meData?.role === "SUPERVISOR") {
          setCurrentUserRole(meData.role);
        }
        if (permData?.permissions && typeof permData.permissions === "object" && !Array.isArray(permData.permissions)) {
          setPermissions((prev) => ({ ...DEFAULT_PERMISSIONS, ...prev, ...permData.permissions }));
        }
        if (featureData) {
          setFeatures({
            show_pagos: featureData.show_pagos ?? false,
            show_servicios: featureData.show_servicios ?? false,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
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

  /** Marcar o desmarcar todos los permisos para un rol (columna) */
  const handleSelectAllForRole = (role: RoleKey, checked: boolean) => {
    setPermissions((prev) => {
      const next = { ...prev };
      visiblePermissions.forEach((perm) => {
        next[perm.key] = { ...next[perm.key], [role]: checked ? 1 : 0 };
      });
      return next;
    });
  };

  /** Marcar o desmarcar un permiso para todos los roles (fila). Si el usuario es admin, no se modifica la columna ADMIN. */
  const handleSelectAllForPermission = (permKey: string, checked: boolean) => {
    const value = checked ? 1 : 0;
    setPermissions((prev) => ({
      ...prev,
      [permKey]: {
        ADMIN: isAdminColumnDisabled ? (prev[permKey]?.ADMIN ?? 1) : value,
        PROFESSIONAL: value,
        SUPERVISOR: value,
      },
    }));
  };

  // Filter permissions based on enabled features
  const visiblePermissions = PERMISSIONS.filter((perm) => {
    if (perm.key === "pagos") return features?.show_pagos ?? false;
    if (perm.key === "servicios") return features?.show_servicios ?? false;
    return true;
  });

  const allSelectedForRole = (role: RoleKey) =>
    visiblePermissions.every((perm) => (permissions[perm.key]?.[role] ?? (role === "ADMIN" ? 1 : 0)) === 1);
  const noneSelectedForRole = (role: RoleKey) =>
    visiblePermissions.every((perm) => (permissions[perm.key]?.[role] ?? 0) === 0);
  const someSelectedForRole = (role: RoleKey) => !allSelectedForRole(role) && !noneSelectedForRole(role);

  const allSelectedForPermission = (permKey: string) =>
    (permissions[permKey]?.ADMIN ?? 1) === 1 &&
    (permissions[permKey]?.PROFESSIONAL ?? 0) === 1 &&
    (permissions[permKey]?.SUPERVISOR ?? 0) === 1;
  const noneSelectedForPermission = (permKey: string) =>
    (permissions[permKey]?.ADMIN ?? 0) === 0 &&
    (permissions[permKey]?.PROFESSIONAL ?? 0) === 0 &&
    (permissions[permKey]?.SUPERVISOR ?? 0) === 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ permissions }),
      });
      if (res.ok) {
        setAlert({ open: true, message: "Permisos guardados correctamente.", type: "success" });
      } else {
        setAlert({ open: true, message: "Error al guardar permisos.", type: "error" });
      }
    } catch (e) {
      setAlert({ open: true, message: "Error de red al guardar permisos.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section>
        <PanelHeader
          title="Roles"
          subtitle="Activa o desactiva permisos por rol. Controla los accesos de tus colaboradores al panel de administracion."
        />

        {features && (!features.show_pagos || !features.show_servicios) && (
          <Card className="mb-4 border border-amber-200 bg-amber-50">
            <div className="p-4 text-sm text-amber-800">
              <p className="font-medium mb-1">Módulos desactivados:</p>
              <ul className="list-disc list-inside">
                {!features.show_pagos && <li>Pagos - Los permisos de esta sección no se muestran hasta que esté habilitada.</li>}
                {!features.show_servicios && <li>Servicios - Los permisos de esta sección no se muestran hasta que esté habilitada.</li>}
              </ul>
              <p className="mt-2 text-xs text-amber-700">Actívalos en la configuración de tenant para que aparezcan aquí.</p>
            </div>
          </Card>
        )}

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
              isLoading={loading || !features}
              loadingContent={<Spinner label="Cargando..." />}
              emptyContent={null}
            >
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableCell>
                  <Tooltip content="Marcar o desmarcar todos los permisos de cada columna" placement="right">
                    <span className="text-sm font-medium text-slate-600">Seleccionar todos</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip content={isAdminColumnDisabled ? "No podés modificar los permisos del rol Administrador" : "Marcar o desmarcar todos para Administrador"} placement="top">
                    <Checkbox
                      isSelected={allSelectedForRole("ADMIN")}
                      isIndeterminate={someSelectedForRole("ADMIN")}
                      onValueChange={(checked) => handleSelectAllForRole("ADMIN", checked ?? false)}
                      aria-label="Todos Administrador"
                      isDisabled={isAdminColumnDisabled}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip content="Marcar o desmarcar todos para Profesional" placement="top">
                    <Checkbox
                      isSelected={allSelectedForRole("PROFESSIONAL")}
                      isIndeterminate={someSelectedForRole("PROFESSIONAL")}
                      onValueChange={(checked) => handleSelectAllForRole("PROFESSIONAL", checked ?? false)}
                      aria-label="Todos Profesional"
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip content="Marcar o desmarcar todos para Recepcionista" placement="top">
                    <Checkbox
                      isSelected={allSelectedForRole("SUPERVISOR")}
                      isIndeterminate={someSelectedForRole("SUPERVISOR")}
                      onValueChange={(checked) => handleSelectAllForRole("SUPERVISOR", checked ?? false)}
                      aria-label="Todos Recepcionista"
                    />
                  </Tooltip>
                </TableCell>
              </TableRow>
              <>
              {visiblePermissions.map((perm) => (
                <TableRow key={perm.key}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tooltip content="Marcar o desmarcar este permiso para todos los roles" placement="right">
                        <Checkbox
                          isSelected={allSelectedForPermission(perm.key)}
                          isIndeterminate={
                            !allSelectedForPermission(perm.key) && !noneSelectedForPermission(perm.key)
                          }
                          onValueChange={(checked) =>
                            handleSelectAllForPermission(perm.key, checked ?? false)
                          }
                          aria-label={`${perm.label} todos los roles`}
                          size="sm"
                          className="shrink-0"
                        />
                      </Tooltip>
                      <div>
                        <Tooltip content={`${perm.text}`} placement="right">
                          <span className="text-sm font-medium text-slate-800">{perm.label}</span>
                        </Tooltip>
                        <span className="text-xs text-slate-500 block">{perm.path}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Tooltip content={isAdminColumnDisabled ? "No podés modificar tus propios permisos de Administrador" : `${perm.label} como Administrador`} placement="top">
                      <Checkbox
                        isSelected={(permissions[perm.key]?.ADMIN ?? 1) === 1}
                        onValueChange={(checked) => handleChange(perm.key, "ADMIN", checked)}
                        aria-label={`${perm.label} Administrador`}
                        isDisabled={isAdminColumnDisabled}
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
              </>
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
      </Section>
  );
}
