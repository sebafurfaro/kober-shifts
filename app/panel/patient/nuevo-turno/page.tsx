"use client"

import { PanelHeader } from "../../components/PanelHeader";
import {
    Box,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    List,
    ListItem
} from "@mui/material";
import { useState } from "react";

export default function NewAppointment() {
    const [professional, setProfessional] = useState("");
    const [professionals, setProfessionals] = useState([
        { id: "1", name: "Profesional 1" },
        { id: "2", name: "Profesional 2" },
        { id: "3", name: "Profesional 3" },
    ]);

    const [data, setData] = useState([
        {
            id: 1,
            date: "15/01/2026",
            hour: "16:00"
        },
        {
            id: 2,
            date: "15/01/2026",
            hour: "16:45"
        },
        {
            id: 3,
            date: "20/01/2026",
            hour: "15:00"
        },
        {
            id: 4,
            date: "22/01/2026",
            hour: "16:00"
        }
    ])

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <PanelHeader
                title="Nuevo Turno"
                subtitle="Para crear un nuevo turno, debes seleccionar las opciones"
            />
            <Box sx={{
                display: "grid",
                gridTemplateColumns: "1fr .5fr 2fr",
                gap: 2,
            }}>
                <Box sx={{ py: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Selecciona el profesional
                    </Typography>
                    <FormControl fullWidth>
                        <InputLabel>Profesional</InputLabel>
                        <Select
                            label="Profesional"
                            value={professional}
                            onChange={(e) => setProfessional(e.target.value)}
                        >
                            {professionals.map((professional) => (
                                <MenuItem key={professional.id} value={professional.id}>
                                    {professional.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <Box></Box>
                <Box sx={{ py: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Selecciona el turno de acuerdo a la disponibilidad
                    </Typography>
                    <List>
                        {data.map((item) => (
                            <ListItem key={item.id}>
                                <Typography color="text.secondary">
                                    {item.date}
                                </Typography>
                                <Typography color="text.secondary">
                                    {item.hour}
                                </Typography>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Box>
        </Container >
    );
}
