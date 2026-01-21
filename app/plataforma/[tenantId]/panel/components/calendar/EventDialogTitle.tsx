interface EventDialogTitleProps {
  mode: "create" | "edit" | "view";
  eventId?: string;
}

export function EventDialogTitle({ mode, eventId }: EventDialogTitleProps) {
  const title =
    mode === "create"
      ? "Nuevo Turno"
      : mode === "edit"
      ? "Editar Turno"
      : "Detalles del Turno";

  const displayTitle = eventId ? `[${eventId}] ${title}` : title;

  return <>{displayTitle}</>;
}

