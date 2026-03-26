"use client";

import * as React from "react";
import {
  Accordion,
  AccordionItem,
  Chip,
  Input,
  Select,
  SelectItem,
  Button,
  Spinner,
  Card,
  CardBody,
} from "@heroui/react";
import {
  Plus,
  Trash2,
} from "lucide-react";
import { AvailabilityConfig, Slot } from "./types";

interface AvailabilityTabProps {
  availabilityConfig: AvailabilityConfig;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSave?: () => void;
  loading?: boolean;
}

const DAYS_NAMES = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

export function AvailabilityTab({ availabilityConfig, setFormData, onSave, loading }: AvailabilityTabProps) {
  const addSlot = (dayNum: number) => {
    const newSlot: Slot = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: "09:00",
      endTime: "18:00",
      fromDate: new Date().toISOString().split("T")[0],
      toDate: null,
      repeat: "weekly",
    };

    setFormData((prev: any) => {
      const dayConfig = prev.availabilityConfig.days[dayNum] || { slots: [] };
      return {
        ...prev,
        availabilityConfig: {
          ...prev.availabilityConfig,
          days: {
            ...prev.availabilityConfig.days,
            [dayNum]: {
              ...dayConfig,
              slots: [...dayConfig.slots, newSlot],
            },
          },
        },
      };
    });
  };

  const updateSlot = (dayNum: number, slotId: string, updates: Partial<Slot>) => {
    setFormData((prev: any) => {
      const dayConfig = prev.availabilityConfig.days[dayNum];
      return {
        ...prev,
        availabilityConfig: {
          ...prev.availabilityConfig,
          days: {
            ...prev.availabilityConfig.days,
            [dayNum]: {
              ...dayConfig,
              slots: dayConfig.slots.map((s: Slot) => (s.id === slotId ? { ...s, ...updates } : s)),
            },
          },
        },
      };
    });
  };

  const removeSlot = (dayNum: number, slotId: string) => {
    setFormData((prev: any) => {
      const dayConfig = prev.availabilityConfig.days[dayNum];
      return {
        ...prev,
        availabilityConfig: {
          ...prev.availabilityConfig,
          days: {
            ...prev.availabilityConfig.days,
            [dayNum]: {
              ...dayConfig,
              slots: dayConfig.slots.filter((s: Slot) => s.id !== slotId),
            },
          },
        },
      };
    });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-gray-800">
        Configuración de Horarios
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Configura los rangos horarios para cada día. Si la fecha de fin queda vacía, se considera recurrente indefinidamente.
      </p>

      <Accordion variant="bordered" className="w-full">
        {DAYS_NAMES.map((day) => {
          const dayConfig = availabilityConfig.days[day.value] || { slots: [] };
          const hasSlots = dayConfig.slots.length > 0;

          return (
            <AccordionItem
              key={day.value}
              aria-label={day.label}
              title={
                <div className="flex items-center justify-between w-full">
                  <span className={`font-semibold flex-1 ${hasSlots ? "text-gray-900" : "text-gray-800"}`}>
                    {day.label}
                  </span>
                  <Chip
                    size="sm"
                    color={hasSlots ? "primary" : "default"}
                    variant={hasSlots ? "solid" : "bordered"}
                    className={hasSlots ? "font-semibold text-white" : "font-semibold text-slate-800"}
                  >
                    {hasSlots ? `${dayConfig.slots.length} ${dayConfig.slots.length === 1 ? 'franja' : 'franjas'}` : "No atiende"}
                  </Chip>
                </div>
              }
              className={hasSlots ? "bg-white" : "bg-gray-50"}
            >
              <div className="space-y-4 p-2">
                {hasSlots ? (
                  dayConfig.slots.map((slot: Slot) => (
                    <Card key={slot.id} className="p-4 border border-gray-200">
                      <CardBody className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Columna Izquierda: Horarios y Fecha Inicio */}
                          <div className="space-y-4">
                            {/* Grupo 1: startTime - endTime */}
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-2">
                                Horario de Atención
                              </p>
                              <div className="flex flex-col md:flex-row gap-3">
                                <Input
                                  label="Inicio"
                                  type="time"
                                  size="sm"
                                  value={slot.startTime}
                                  onValueChange={(value) =>
                                    updateSlot(day.value, slot.id, { startTime: value })
                                  }
                                  className="flex-1"
                                  classNames={{
                                    input: "text-slate-800",
                                    inputWrapper: "text-slate-800",
                                  }}
                                />
                                <Input
                                  label="Fin"
                                  type="time"
                                  size="sm"
                                  value={slot.endTime}
                                  onValueChange={(value) =>
                                    updateSlot(day.value, slot.id, { endTime: value })
                                  }
                                  className="flex-1"
                                  classNames={{
                                    input: "text-slate-800",
                                    inputWrapper: "text-slate-800",
                                  }}
                                />
                              </div>
                            </div>
                            {/* Grupo 2: fromDate */}
                            <Input
                              label="Vigente desde"
                              type="date"
                              size="sm"
                              value={slot.fromDate}
                              onValueChange={(value) =>
                                updateSlot(day.value, slot.id, { fromDate: value })
                              }
                              className="w-full"
                              classNames={{
                                input: "text-slate-800",
                                inputWrapper: "text-slate-800",
                              }}
                            />
                          </div>

                          {/* Columna Derecha: Recurrencia y Fecha Fin */}
                          <div className="space-y-4">
                            {/* Grupo 3: repeat */}
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-2">
                                Recurrencia
                              </p>
                              <Select
                                size="sm"
                                selectedKeys={[slot.repeat]}
                                onSelectionChange={(keys) => {
                                  const selected = Array.from(keys)[0] as string;
                                  updateSlot(day.value, slot.id, {
                                    repeat: selected as any,
                                  });
                                }}
                                className="w-full"
                                classNames={{
                                  trigger: "h-10 min-h-10",
                                  value: "text-slate-800",
                                  popoverContent: "text-slate-800",
                                }}
                              >
                                <SelectItem key="weekly" className="text-slate-800">Semanal</SelectItem>
                                <SelectItem key="biweekly" className="text-slate-800">Quincenal</SelectItem>
                                <SelectItem key="monthly" className="text-slate-800">Mensual</SelectItem>
                              </Select>
                            </div>
                            {/* Grupo 4: toDate */}
                            <Input
                              label="Vigente hasta (opcional)"
                              type="date"
                              size="sm"
                              value={slot.toDate || ""}
                              onValueChange={(value) =>
                                updateSlot(day.value, slot.id, { toDate: value || null })
                              }
                              className="w-full"
                              classNames={{
                                input: "text-slate-800",
                                inputWrapper: "text-slate-800",
                              }}
                            />
                          </div>
                        </div>
                        <div className="mt-6 flex flex-col md:flex-row gap-3 justify-end">
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => removeSlot(day.value, slot.id)}
                            startContent={<Trash2 className="w-4 h-4" />}
                          >
                            Eliminar
                          </Button>
                          <Button
                            size="sm"
                            color="primary"
                            onPress={() => onSave?.()}
                            isDisabled={loading}
                            isLoading={loading}
                          >
                            {loading ? "Guardando..." : "Guardar Franja"}
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-gray-600">
                      No hay franjas horarias configuradas para este día. El profesional no figurará disponible para atención.
                    </p>
                  </div>
                )}
                <Button
                  startContent={<Plus className="w-4 h-4" />}
                  variant="bordered"
                  color="secondary"
                  onPress={() => addSlot(day.value)}
                  className="w-full border-dashed"
                >
                  Añadir Franja Horaria
                </Button>
              </div>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
