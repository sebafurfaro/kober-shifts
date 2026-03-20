"use client";

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";

interface Patient {
  email: string;
  phone?: string | null;
  address?: string | null;
  dni?: string | null;
  coverage?: string | null;
  plan?: string | null;
  dateOfBirth?: string | null;
  admissionDate?: string | null;
  gender?: string | null;
  nationality?: string | null;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const FIELDS: { key: keyof Patient; label: string; format?: (v: string | null | undefined) => string }[] = [
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
          const raw = patient[f.key] as string | null | undefined;
          const value = f.format ? f.format(raw) : (raw || "—");
          return (
            <TableRow key={f.key}>
              <TableCell>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{f.label}</span>
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
