import Link from "next/link";
import { Card, CardBody, Button } from "@heroui/react";

export default async function BookingOkPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  
  return (
    <div className="max-w-3xl mx-auto mt-8 px-4 text-center">
      <Card className="mb-6">
        <CardBody className="py-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-4">
            ¡Turno confirmado y pago recibido!
          </h1>
          <p className="text-default-600 mb-8 max-w-md">
            Hemos registrado tu pago exitosamente. Si la transacción fue aprobada, tu turno quedará asignado y recibirás una notificación en breve. En caso de quedar pendiente o bajo análisis, se confirmará al acreditarse.
          </p>
          <div className="flex gap-4">
            <Button
              as={Link}
              href={`/plataforma/${tenantId}/panel/patient`}
              color="primary"
            >
              Ir a mi panel
            </Button>
            <Button
              as={Link}
              href={`/plataforma/${tenantId}/reservar`}
              variant="bordered"
            >
              Volver a reservar
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
