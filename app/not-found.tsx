"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import Logo from "./branding/Logo";
import Typography from "./components/Typography";

export default function TenantNotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
          <div className="max-w-md w-full text-center space-y-6 flex flex-col items-center justify-center">
            <Logo width={80} height={80} />
            <Typography variant="h1" className="text-primary">
              Oops!
            </Typography>
            <Typography variant="h3" className="text-primary">
              El recurso solicitado no se encuentra disponible
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 w-full items-center gap-4">
              <Button as={Link} href="/" color="secondary" variant="solid" radius="full">
                Volver al inicio
              </Button>
              <Button as={Link} href="https://wa.me/5491173740338?text=Hola, quiero saber más sobre NODO App Turnos" variant="solid" radius="full" color="primary">
                Comenzar ahora!
              </Button>
            </div>
          </div>
        </div>
  );
}
