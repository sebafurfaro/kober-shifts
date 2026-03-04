import { Button } from "@heroui/react";

interface EventDialogData {
  id?: string;
  start: Date;
  end: Date;
  patientId?: string;
  professionalId?: string;
  locationId?: string;
  notes?: string;
}

interface EventDialogActionsProps {
  mode: "create" | "edit" | "view";
  selectedEventId?: string;
  eventDialogData: EventDialogData | null;
  isHolidayEvent?: boolean; // Flag to identify holiday events
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onCancel: () => void;
  onSave: () => Promise<void>;
}

export function EventDialogActions({
  mode,
  selectedEventId,
  eventDialogData,
  isHolidayEvent = false,
  onEdit,
  onDelete,
  onCancel,
  onSave,
}: EventDialogActionsProps) {
  return (
    <>
      {mode === "view" && !isHolidayEvent && (
        <>
          <Button variant="bordered" onPress={onEdit}>
            Editar
          </Button>
          <Button color="danger" onPress={onDelete}>
            Eliminar
          </Button>
        </>
      )}
      <Button variant="light" onPress={onCancel}>
        {mode === "view" ? "Cerrar" : "Cancelar"}
      </Button>
      {mode !== "view" && (
        <Button color="primary" onPress={onSave}>
          Guardar
        </Button>
      )}
    </>
  );
}

