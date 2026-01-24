"use client";

import * as React from "react";
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Select,
  SelectItem,
  Pagination,
} from "@heroui/react";
import type { PatientsResponse } from "./types";

interface PatientsTableProps {
  patientsData: PatientsResponse | null;
  loading: boolean;
  currentPage: number;
  sortBy: "totalAppointments" | "cancelledAppointments";
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: "totalAppointments" | "cancelledAppointments") => void;
}

export function PatientsTable({
  patientsData,
  loading,
  currentPage,
  sortBy,
  onPageChange,
  onSortChange,
}: PatientsTableProps) {
  const handleSortChange = React.useCallback(
    (keys: unknown) => {
      const selected = Array.from(keys as Iterable<React.Key>)[0] as string;
      onSortChange(selected as "totalAppointments" | "cancelledAppointments");
      onPageChange(1);
    },
    [onSortChange, onPageChange]
  );

  return (
    <Card className="mb-8">
      <CardBody className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Pacientes
          </h3>
          <Select
            label="Ordenar por"
            selectedKeys={[sortBy]}
            onSelectionChange={handleSortChange}
            className="w-48 text-gray-800"
            size="sm"
            variant="underlined"
          >
            <SelectItem key="totalAppointments" className="text-gray-800">Turnos Totales</SelectItem>
            <SelectItem key="cancelledAppointments" className="text-gray-800">Turnos Cancelados</SelectItem>
          </Select>
        </div>

        <Table aria-label="Tabla de pacientes">
          <TableHeader>
            <TableColumn>Nombre</TableColumn>
            <TableColumn>Email</TableColumn>
            <TableColumn>Teléfono</TableColumn>
            <TableColumn align={"end" as "start" | "center" | "end"}>
              Turnos Totales
            </TableColumn>
            <TableColumn align={"end" as "start" | "center" | "end"}>
              Turnos Cancelados
            </TableColumn>
          </TableHeader>
          <TableBody
            isLoading={loading}
            loadingContent={<Spinner label="Cargando..." />}
            emptyContent={loading ? null : "No hay pacientes registrados"}
          >
            {(patientsData?.patients || []).map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>
                  {patient.firstName && patient.lastName
                    ? `${patient.firstName} ${patient.lastName}`
                    : patient.name}
                </TableCell>
                <TableCell>{patient.email}</TableCell>
                <TableCell>{patient.phone || "-"}</TableCell>
                <TableCell className="text-right">
                  {patient.totalAppointments}
                </TableCell>
                <TableCell className="text-right">
                  {patient.cancelledAppointments}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {patientsData && patientsData.pagination.totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination
              total={patientsData.pagination.totalPages}
              page={currentPage}
              onChange={onPageChange}
              showControls
              showShadow
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
