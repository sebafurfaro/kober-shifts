import { Button } from "@heroui/react";

interface EventDialogData {
  id?: string;
  start: Date;
  end: Date;
  patientId?: string;
  professionalId?: string;
  locationId?: string;
  specialtyId?: string;
  notes?: string;
}

interface EventDialogActionsProps {
  mode: "create" | "edit" | "view";
  selectedEventId?: string;
  eventDialogData: EventDialogData | null;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onCancel: () => void;
  onSave: () => Promise<void>;
}

export function EventDialogActions({
  mode,
  selectedEventId,
  eventDialogData,
  onEdit,
  onDelete,
  onCancel,
  onSave,
}: EventDialogActionsProps) {
  return (
    <>
      {mode === "view" && (
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

