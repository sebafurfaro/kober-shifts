"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { Section } from "./plataforma/[tenantId]/panel/components/layout/Section";
import Typography from "./components/Typography";

export default function TenantNotFoundPage() {
  return (
    <div className="bg-white w-full min-h-screen">
      <Section>
        <div className="flex flex-col space-y-4">
          <Typography variant="h1" className="text-primary">Oops!</Typography>
          <Typography>El recurso que estás buscando no se encuentra disponible</Typography>
          <div className="flex items-center gap-4 w-full max-w-1/2">
            <Button as={Link} href="https://wa.me/5491173740338?text=Hola, quiero saber más sobre NODO App Turnos" variant="solid" color="secondary" radius="full">Comenzar ahora!</Button>
            <Button as={Link} href="/" variant="solid" color="primary" radius="full">Ir al inicio</Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
