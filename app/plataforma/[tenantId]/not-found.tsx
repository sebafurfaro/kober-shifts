"use client";

import Link from "next/link";
import { Button } from "@heroui/react";

export default function TenantNotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800">
          El negocio que está buscando no se encuentra disponible
        </h1>
        <p className="text-slate-600">
          Comunicate con el dueño del negocio para verificar el enlace o intentá nuevamente más tarde.
        </p>
        <Button as={Link} href="/" color="primary" variant="flat">
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
