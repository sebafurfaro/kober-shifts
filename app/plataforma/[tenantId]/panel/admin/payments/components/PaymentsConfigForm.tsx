"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Switch, Accordion, AccordionItem } from "@heroui/react";

type PaymentMode = "none" | "deposit" | "full";

export function PaymentsConfigForm() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [loading, setLoading] = React.useState(true);
  const [mode, setMode] = React.useState<PaymentMode>("none");

  React.useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const res = await fetch(`/api/plataforma/${tenantId}/admin/payments`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load payments config");
        const data = await res.json();
        const cfg = data?.paymentConfig;
        setMode(cfg?.mode || "none");
      } catch (error) {
        console.error("Error loading payments config:", error);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [tenantId]);

  React.useEffect(() => {
    async function saveConfig() {
      if (loading) return;
      try {
        const res = await fetch(`/api/plataforma/${tenantId}/admin/payments`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentConfig: {
              mode,
            },
          }),
        });
        if (!res.ok) throw new Error("Failed to save payments config");
      } catch (error) {
        console.error("Error saving payments config:", error);
      }
    }
    saveConfig();
  }, [tenantId, mode, loading]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-4">Configuración</h2>
          <p className="text-sm text-gray-500">
            Definí si el sistema debe cobrar o no.
          </p>
        </div>
        <Switch
          isSelected={mode !== "none"}
          onValueChange={(value) => setMode(value ? "deposit" : "none")}
          isDisabled={loading}
        >
          {mode === "none" ? "Sin cobros" : "Con cobros"}
        </Switch>
      </div>
      {mode !== "none" && (
        <Accordion variant="splitted">
          <AccordionItem key="deposit" title="Seña">
            <p className="text-sm text-gray-600">
              El monto de seña se verá reflejado en la creacion de la cita. El cliente reservara el turno, y luego de pagarla se pasara a turno confirmado.
            </p>
          </AccordionItem>
          <AccordionItem key="full" title="Total">
            <p className="text-sm text-gray-600">
              El monto total se verá reflejado en la creacion de la cita. El cliente reservara el turno, y luego de pagarla se pasara a turno confirmado.
            </p>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
