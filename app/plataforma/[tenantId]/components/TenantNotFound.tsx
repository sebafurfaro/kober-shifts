"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import Logo from "@/app/branding/Logo";
import Typography from "@/app/components/Typography";

/**
 * UI cuando el tenant no existe o no está activo.
 * Se usa en layout, page y not-found para evitar depender del comportamiento de notFound().
 */
export function TenantNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center space-y-6 flex flex-col items-center justify-center">
        <Logo width={80} height={80} />
        <Typography variant="h3" className="text-primary">
          El negocio que está buscando no se encuentra disponible
        </Typography>
        <Typography variant="p" className="text-slate-600">
          Comunicate con el dueño del negocio para verificar el enlace o intentá nuevamente más tarde.
        </Typography>
        <Button as={Link} href="/" color="primary" variant="solid">
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
