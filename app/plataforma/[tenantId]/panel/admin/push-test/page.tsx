"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Button, Card, CardBody, Alert, Chip } from "@heroui/react";
import { PanelHeader } from "../../components/PanelHeader";
import { Section } from "../../components/layout/Section";
import { urlBase64ToUint8Array } from "@/lib/push/url-base64-to-uint8";
import { Role } from "@/lib/types";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export default function PushTestPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;

  const [role, setRole] = React.useState<Role | null>(null);
  const [perm, setPerm] = React.useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<{ type: "success" | "danger"; text: string } | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/plataforma/${tenantId}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.role) setRole(data.role as Role);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const requestPermission = async () => {
    setMsg(null);
    if (!("Notification" in window)) {
      setMsg({ type: "danger", text: "Este navegador no soporta notificaciones." });
      return;
    }
    setBusy("permiso");
    try {
      const r = await Notification.requestPermission();
      setPerm(r);
      if (r !== "granted") {
        setMsg({ type: "danger", text: "Permiso denegado. Activá notificaciones en la configuración del sitio." });
      }
    } finally {
      setBusy(null);
    }
  };

  const subscribePush = async () => {
    setMsg(null);
    if (!VAPID_PUBLIC) {
      setMsg({ type: "danger", text: "Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY en el entorno (reiniciá el servidor tras editar .env)." });
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMsg({ type: "danger", text: "Push API no disponible en este navegador." });
      return;
    }
    setBusy("suscribir");
    try {
      const reg = await navigator.serviceWorker.ready;
      const key = urlBase64ToUint8Array(VAPID_PUBLIC);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key as BufferSource,
      });
      const res = await fetch(`/api/plataforma/${tenantId}/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || res.statusText);
      }
      setSubscribed(true);
      setMsg({ type: "success", text: "Suscripción guardada en la base de datos." });
    } catch (e) {
      setMsg({ type: "danger", text: e instanceof Error ? e.message : "Error al suscribirse" });
    } finally {
      setBusy(null);
    }
  };

  const sendTest = async () => {
    setMsg(null);
    setBusy("enviar");
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/push/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: "Turnos Nodo — prueba",
          body: "Si ves esto, Web Push + VAPID funcionan.",
          url: `/plataforma/${tenantId}/panel`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText);
      setMsg({ type: "success", text: "Notificación enviada. Puede tardar unos segundos." });
    } catch (e) {
      setMsg({ type: "danger", text: e instanceof Error ? e.message : "Error al enviar" });
    } finally {
      setBusy(null);
    }
  };

  const isAdmin = role === Role.ADMIN;

  return (
    <Section>
      <PanelHeader
        title="Web Push — pruebas locales"
        subtitle="Suscripción con VAPID y envío de prueba desde el servidor (solo ADMIN puede disparar el envío)."
      />

      <Card className="mb-4">
        <CardBody className="gap-3 text-sm text-slate-600">
          <p>
            <strong>HTTPS en desarrollo:</strong> ejecutá{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">npm run dev:https</code>{" "}
            (ver script en package.json). Sin HTTPS, el navegador suele bloquear Push en localhost.
          </p>
          <p>
            Variables: <code className="text-xs">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code>,{" "}
            <code className="text-xs">VAPID_PRIVATE_KEY</code>, opcional{" "}
            <code className="text-xs">VAPID_SUBJECT</code> (p. ej. <code className="text-xs">mailto:tu@email.com</code>
            ).
          </p>
        </CardBody>
      </Card>

      {msg && (
        <Alert color={msg.type === "success" ? "success" : "danger"} title={msg.type === "success" ? "Listo" : "Error"} className="mb-4">
          {msg.text}
        </Alert>
      )}

      <Card>
        <CardBody className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-600">Estado permiso:</span>
            <Chip size="sm" color={perm === "granted" ? "success" : perm === "denied" ? "danger" : "default"}>
              {perm === "unsupported" ? "No soportado" : perm}
            </Chip>
            {role && (
              <Chip size="sm" variant="flat">
                Rol: {role}
              </Chip>
            )}
          </div>

          {!VAPID_PUBLIC && (
            <Alert color="warning" title="Falta clave pública">
              Definí NEXT_PUBLIC_VAPID_PUBLIC_KEY y reiniciá <code className="text-xs">next dev</code>.
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              color="primary"
              variant="flat"
              isDisabled={perm === "granted" || perm === "unsupported" || !!busy}
              isLoading={busy === "permiso"}
              onPress={requestPermission}
            >
              Pedir permiso de notificaciones
            </Button>
            <Button
              color="primary"
              isDisabled={perm !== "granted" || !VAPID_PUBLIC || !!busy}
              isLoading={busy === "suscribir"}
              onPress={subscribePush}
            >
              Suscribirse al push (guardar en servidor)
            </Button>
            <Button
              color="secondary"
              isDisabled={!isAdmin || !subscribed || !!busy}
              isLoading={busy === "enviar"}
              onPress={sendTest}
            >
              Enviar notificación de prueba (ADMIN)
            </Button>
          </div>

          {!isAdmin && subscribed && (
            <p className="text-xs text-slate-500">
              Solo usuarios ADMIN pueden llamar al endpoint de envío de prueba. Iniciá sesión como admin para probar el
              envío.
            </p>
          )}
        </CardBody>
      </Card>
    </Section>
  );
}
