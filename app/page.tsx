"use client";

import Link from "next/link";
import { Button } from "@heroui/react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Kober Shifts</h1>
          <p className="text-gray-500">
            Sistema de turnos: pacientes, profesionales y administración del centro.
          </p>
          <div className="flex gap-4">
            <Button as={Link} href="/login" color="primary">
              Ingresar
            </Button>
            <Button as={Link} href="/register" variant="bordered">
              Crear cuenta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
