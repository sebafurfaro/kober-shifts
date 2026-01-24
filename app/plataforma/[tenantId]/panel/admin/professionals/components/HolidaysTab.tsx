"use client";

import * as React from "react";
import {
  Input,
  Button,
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@heroui/react";
import { Plus, Trash2, Calendar } from "lucide-react";
import { Holiday } from "./types";

interface HolidaysTabProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSave?: () => void;
  loading?: boolean;
}

export function HolidaysTab({ formData, setFormData, onSave, loading }: HolidaysTabProps) {
  const holidays = formData.holidays || formData.availabilityConfig?.holidays || [];

  const [newHoliday, setNewHoliday] = React.useState<Partial<Holiday>>({
    startDate: "",
    endDate: "",
    description: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateHoliday = (holiday: Partial<Holiday>): boolean => {
    const newErrors: Record<string, string> = {};

    if (!holiday.startDate) {
      newErrors.startDate = "La fecha de inicio es requerida";
    }
    if (!holiday.endDate) {
      newErrors.endDate = "La fecha de fin es requerida";
    }
    if (holiday.startDate && holiday.endDate) {
      const start = new Date(holiday.startDate);
      const end = new Date(holiday.endDate);
      if (start > end) {
        newErrors.endDate = "La fecha de fin debe ser posterior a la fecha de inicio";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addHoliday = () => {
    if (!validateHoliday(newHoliday)) return;

    const holiday: Holiday = {
      id: Math.random().toString(36).substr(2, 9),
      startDate: newHoliday.startDate!,
      endDate: newHoliday.endDate!,
      description: newHoliday.description || undefined,
    };

    const updatedHolidays = [...holidays, holiday];

    setFormData((prev: any) => {
      const updatedAvailabilityConfig = {
        ...prev.availabilityConfig,
        holidays: updatedHolidays,
      };
      return {
        ...prev,
        availabilityConfig: updatedAvailabilityConfig,
        holidays: updatedHolidays,
      };
    });

    setNewHoliday({ startDate: "", endDate: "", description: "" });
    setErrors({});
  };

  const removeHoliday = (id: string) => {
    const updatedHolidays = holidays.filter((h: Holiday) => h.id !== id);

    setFormData((prev: any) => {
      const updatedAvailabilityConfig = {
        ...prev.availabilityConfig,
        holidays: updatedHolidays,
      };
      return {
        ...prev,
        availabilityConfig: updatedAvailabilityConfig,
        holidays: updatedHolidays,
      };
    });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDaysCount = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Períodos de Vacaciones</h3>
        <p className="text-sm text-gray-600 mb-4">
          Los períodos de vacaciones sobrescriben las franjas de disponibilidad configuradas.
          Durante estos períodos, no se mostrarán turnos disponibles para los pacientes.
        </p>
      </div>

      <Card>
        <CardBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="date"
                label="Fecha de inicio"
                value={newHoliday.startDate}
                onChange={(e) =>
                  setNewHoliday((prev) => ({ ...prev, startDate: e.target.value }))
                }
                isInvalid={!!errors.startDate}
                errorMessage={errors.startDate}
                variant="underlined"
                classNames={{
                  inputWrapper: "h-11",
                }}
              />
              <Input
                type="date"
                label="Fecha de fin"
                value={newHoliday.endDate}
                onChange={(e) =>
                  setNewHoliday((prev) => ({ ...prev, endDate: e.target.value }))
                }
                isInvalid={!!errors.endDate}
                errorMessage={errors.endDate}
                variant="underlined"
                classNames={{
                  inputWrapper: "h-11",
                }}
              />
              <Input
                label="Descripción (opcional)"
                value={newHoliday.description || ""}
                onChange={(e) =>
                  setNewHoliday((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Ej: Vacaciones de verano"
                variant="underlined"
                classNames={{
                  inputWrapper: "h-11",
                }}
              />
            </div>
            <Button
              onPress={addHoliday}
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              isDisabled={loading}
            >
              Agregar período
            </Button>
          </div>
        </CardBody>
      </Card>

      {holidays.length > 0 && (
        <Card>
          <CardBody>
            <Table aria-label="Lista de períodos de vacaciones" classNames={{ base: "text-slate-800" }}>
              <TableHeader>
                <TableColumn>Período</TableColumn>
                <TableColumn>Duración</TableColumn>
                <TableColumn>Descripción</TableColumn>
                <TableColumn align="end">Acciones</TableColumn>
              </TableHeader>
              <TableBody>
                {holidays.map((holiday: Holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">
                          {formatDate(holiday.startDate)} - {formatDate(holiday.endDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color="primary">
                        {getDaysCount(holiday.startDate, holiday.endDate)} día
                        {getDaysCount(holiday.startDate, holiday.endDate) !== 1 ? "s" : ""}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {holiday.description ? (
                        <span className="text-sm text-gray-600">{holiday.description}</span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Sin descripción</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => removeHoliday(holiday.id)}
                        isDisabled={loading}
                        aria-label="Eliminar período"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {holidays.length === 0 && (
        <Card>
          <CardBody>
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay períodos de vacaciones configurados</p>
              <p className="text-sm mt-2">
                Agrega un período para que no se muestren turnos disponibles durante esas fechas
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
