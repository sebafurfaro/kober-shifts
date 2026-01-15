import { Button, DialogActions } from "@mui/material";

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
    <DialogActions>
      {mode === "view" && (
        <>
          <Button variant="outlined" onClick={onEdit}>
            Editar
          </Button>
          <Button color="error" onClick={onDelete}>
            Eliminar
          </Button>
        </>
      )}
      <Button onClick={onCancel}>
        {mode === "view" ? "Cerrar" : "Cancelar"}
      </Button>
      {mode !== "view" && (
        <Button variant="contained" onClick={onSave}>
          Guardar
        </Button>
      )}
    </DialogActions>
  );
}

