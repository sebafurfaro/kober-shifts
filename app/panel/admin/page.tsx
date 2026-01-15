import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { findUserById } from "@/lib/db";
import { PanelHeader } from "../components/PanelHeader";
import { Card, CardContent, Container, Stack, Typography } from "@mui/material";

export default async function AdminPanelPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await findUserById(session.userId);
  if (!user || user.role !== "ADMIN") redirect("/panel");

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <PanelHeader title="Panel Admin" subtitle={`Hola, ${user.name}.`} />
      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <Typography fontWeight={700}>Accesos rápidos</Typography>
            <Typography variant="body2" color="text.secondary">
              Como admin podés navegar al panel de Paciente o Profesional desde el menú.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}


