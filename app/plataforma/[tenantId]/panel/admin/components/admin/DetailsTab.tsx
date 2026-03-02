"use client"

import { useEffect, useMemo, useState } from "react";
import Typography from "@/app/components/Typography";
import { Input, Switch, Button } from "@heroui/react";
import { Files } from "lucide-react";
import { useParams } from "next/navigation";
import { AlertDialog } from "../../../components/alerts/AlertDialog";
import { useTenantBusinessStore } from "@/lib/tenant-business-store";

export const DetailsTab = () => {
    const [copied, setCopied] = useState(false);
    const [baseUrl, setBaseUrl] = useState("");
    const [alertOpen, setAlertOpen] = useState(false);
    const params = useParams();
    const tenantId = params.tenantId as string;
    const {
        tenantName,
        reservationLink,
        isActive,
        setTenantId,
        setTenantName,
        setReservationLink,
        setActive,
    } = useTenantBusinessStore();

    useEffect(() => {
        setTenantId(tenantId);
        setTenantName(tenantId);
    }, [tenantId, setTenantId, setTenantName]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setBaseUrl(window.location.origin);
        }
    }, []);

    useEffect(() => {
        if (!baseUrl || !tenantId) return;
        setReservationLink(`https://${baseUrl.replace(/^https?:\/\//, "")}/plataforma/${tenantId}`);
    }, [baseUrl, tenantId, setReservationLink]);

    const handleCopy = async (value: string) => {
        if (!isActive) {
            setAlertOpen(true);
            return;
        }
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col bg-white">
            <div className="border-b border-slate-200 py-2 mb-4">
                <Typography variant="h4" color="black">Detalles</Typography>
            </div>
            <div className="flex flex-col space-y-4 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-200 pb-2 mb-4">
                    <div className="flex flex-col space-y-2">
                        <Input
                            label="Nombre"
                            name="tenantName"
                            value={tenantName || tenantId}
                            isReadOnly
                        />
                        <Typography variant="p" size="sm" color="gray" opacity={70} className="mt-2">
                            Es el nombre que verán tus clientes al reservar un turno.
                        </Typography>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <Input
                            label="Link de reservas"
                            name="reservationLink"
                            value={reservationLink}
                            isReadOnly
                            endContent={
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="border-none"
                                    onPress={() => handleCopy(reservationLink)}
                                >
                                    <Files className="w-4 h-4" />
                                </Button>
                            }
                        />
                        <Typography variant="p" size="sm" color="gray" opacity={70} className="mt-2">
                            {copied ? "¡Link copiado!" : "Es el link que usarán tus clientes para sacar turnos con vos o tu negocio. Compartilo para comenzar a recibir reservas."}
                        </Typography>
                    </div>
                </div>
                <div className="flex flex-col space-y-2">
                    <Typography variant="h6" color="black">Estado del Negocio</Typography>
                    <div className="flex items-center justify-between w-full my-4">
                        <Switch name="isActive" isSelected={isActive} onValueChange={setActive}>
                            Permitir reservas
                        </Switch>
                        <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`}></div>
                            <Typography variant="p" size="sm" color={isActive ? "green" : "red"}>
                                {isActive ? "Activo" : "Inactivo"}
                            </Typography>
                        </div>
                    </div>
                    <Typography variant="p" size="sm" color="gray" opacity={70}>
                        Activa el negocio para que tus clientes puedan agendar turnos
                    </Typography>
                </div>
            </div>
            <AlertDialog
                open={alertOpen}
                onClose={() => setAlertOpen(false)}
                message="Hasta que no actives el negocio, no podras compartir el link para recibir reservas de turnos"
                type="warning"
            />
        </div>
    );
}