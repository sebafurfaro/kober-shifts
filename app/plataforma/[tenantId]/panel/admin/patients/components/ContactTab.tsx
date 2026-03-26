"use client";

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";

interface Patient {
  email: string;
  phone?: string | null;
  address?: string | null;
  dni?: string | null;
  coverage?: string | null;
  plan?: string | null;
  dateOfBirth?: string | Date | null;
  admissionDate?: string | Date | null;
  gender?: string | null;
  nationality?: string | null;
}

function formatDate(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function displayScalar(raw: string | null | undefined): string {
  if (raw == null || raw === "") return "—";
  return String(raw);
}

const FIELDS: { key: keyof Patient; label: string; format?: (v: string | Date | null | undefined) => string }[] = [
  { key: "email", label: "Email" },
  { key: "phone", label: "Teléfono" },
  { key: "dni", label: "DNI" },
  { key: "dateOfBirth", label: "Fecha de nacimiento", format: formatDate },
  { key: "gender", label: "Género" },
  { key: "nationality", label: "Nacionalidad" },
  { key: "address", label: "Dirección" },
  { key: "admissionDate", label: "Fecha de ingreso", format: formatDate },
  { key: "coverage", label: "Obra social" },
  { key: "plan", label: "Plan" },
];

export const ContactTab = ({ patient }: { patient: Patient }) => {
  return (
    <Table aria-label="Datos de contacto" removeWrapper hideHeader>
      <TableHeader>
        <TableColumn>Campo</TableColumn>
        <TableColumn>Valor</TableColumn>
      </TableHeader>
      <TableBody>
        {FIELDS.map((f) => {
          const raw = patient[f.key] as string | Date | null | undefined;
          const value = f.format ? f.format(raw) : displayScalar(raw as string | null | undefined);
          return (
            <TableRow key={f.key}>
              <TableCell>
                <span className="text-xs font-medium text-gray-400 md:uppercase md:tracking-wide">{f.label}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-800">{value}</span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
