"use client";

import Link from "next/link";
import { Box, Button, Container, Stack, Typography } from "@mui/material";

export default function Home() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center"}}>
      <Container maxWidth="sm">
        <Stack spacing={2}>
          <Typography variant="h4" fontWeight={700}>
            Kober Shifts
          </Typography>
          <Typography color="text.secondary">
            Sistema de turnos: pacientes, profesionales y administración del centro.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button component={Link} href="/login" variant="contained">
              Ingresar
            </Button>
            <Button component={Link} href="/register" variant="outlined">
              Crear cuenta
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
