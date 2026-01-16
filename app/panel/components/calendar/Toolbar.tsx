import * as React from "react";
import {
    Box,
    Button,
    Paper,
    Stack,
    TextField,
    MenuItem,
    Typography,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ViewType = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

interface ToolbarProps {
    currentDate: Date;
    onToday: () => void;
    onPrev: () => void;
    onNext: () => void;
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    timezone: string;
    onTimezoneChange: (timezone: string) => void;
    onCreateEvent: () => void;
}

export function Toolbar({
    currentDate,
    onToday,
    onPrev,
    onNext,
    currentView,
    onViewChange,
    timezone,
    onTimezoneChange,
    onCreateEvent,
}: ToolbarProps) {
    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    width: '100%',
                    '@media (max-width: 600px)': {
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 2,
                    }
                }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Button
                            onClick={onToday}
                            sx={{ fontWeight: 700, letterSpacing: 0.5 }}
                        >
                            Hoy
                        </Button>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Button
                                variant="contained"
                                size="medium"
                                color="primary"
                                onClick={onPrev}
                                sx={{ fontWeight: 700, letterSpacing: 0.5, borderRadius: 2 }}
                            >
                                ‹
                            </Button>
                            <Button
                                variant="contained"
                                size="medium"
                                color="primary"
                                onClick={onNext}
                                sx={{ fontWeight: 700, letterSpacing: 0.5, borderRadius: 2 }}
                            >
                                ›
                            </Button>
                        </Box>
                    </Box>
                    <Typography
                        variant="h6"
                        sx={{ flexGrow: 1, textTransform: "capitalize" }}
                    >
                        {format(currentDate, "MMMM yyyy", { locale: es })}
                    </Typography>

                    <Box
                        sx={{
                            display: "inline-flex",
                            backgroundColor: "#e0e0e0",
                            borderRadius: 2,
                            padding: 0.5,
                            gap: 0.5,
                        }}
                    >
                        <Button
                            onClick={() => onViewChange("dayGridMonth")}
                            sx={{
                                border: "none",
                                borderRadius: 1.5,
                                paddingX: 2,
                                paddingY: 0.75,
                                textTransform: "none",
                                fontWeight: 500,
                                minWidth: "auto",
                                backgroundColor:
                                    currentView === "dayGridMonth" ? "#ffffff" : "transparent",
                                color: currentView === "dayGridMonth" ? "#212121" : "#757575",
                                boxShadow: "none",
                                "&:hover": {
                                    backgroundColor:
                                        currentView === "dayGridMonth" ? "#ffffff" : "transparent",
                                    boxShadow: "none",
                                },
                            }}
                        >
                            Mes
                        </Button>
                        <Button
                            onClick={() => onViewChange("timeGridWeek")}
                            sx={{
                                border: "none",
                                borderRadius: 1.5,
                                paddingX: 2,
                                paddingY: 0.75,
                                textTransform: "none",
                                fontWeight: 500,
                                minWidth: "auto",
                                backgroundColor:
                                    currentView === "timeGridWeek" ? "#ffffff" : "transparent",
                                color: currentView === "timeGridWeek" ? "#212121" : "#757575",
                                boxShadow: "none",
                                "&:hover": {
                                    backgroundColor:
                                        currentView === "timeGridWeek" ? "#ffffff" : "transparent",
                                    boxShadow: "none",
                                },
                            }}
                        >
                            Semana
                        </Button>
                        <Button
                            onClick={() => onViewChange("timeGridDay")}
                            sx={{
                                border: "none",
                                borderRadius: 1.5,
                                paddingX: 2,
                                paddingY: 0.75,
                                textTransform: "none",
                                fontWeight: 500,
                                minWidth: "auto",
                                backgroundColor:
                                    currentView === "timeGridDay" ? "#ffffff" : "transparent",
                                color: currentView === "timeGridDay" ? "#212121" : "#757575",
                                boxShadow: "none",
                                "&:hover": {
                                    backgroundColor:
                                        currentView === "timeGridDay" ? "#ffffff" : "transparent",
                                    boxShadow: "none",
                                },
                            }}
                        >
                            Diaria
                        </Button>
                    </Box>

                    <Button
                        variant="contained"
                        size="medium"
                        color="primary"
                        onClick={onCreateEvent}
                        sx={{ fontWeight: 700, letterSpacing: 0.5, borderRadius: 2 }}
                    >
                        Crear Turno
                    </Button>

                    <TextField
                        select
                        size="small"
                        value={timezone}
                        onChange={(e) => onTimezoneChange(e.target.value)}
                        sx={{ minWidth: 200, textAlign: "center", display: "none" }}
                    >
                        <MenuItem value="America/Argentina/Buenos_Aires">
                            Buenos Aires (GMT-3)
                        </MenuItem>
                    </TextField>
                </Box>
            </Stack>
        </Paper>
    );
}
