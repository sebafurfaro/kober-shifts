import { Typography } from "@/app/components/Typography"
import { Switch, Select, SelectItem } from "@heroui/react"


export const WhatsappTab = () => {
    return(
        <div className="">
            <div className="max-w-1/2 w-full flex flex-col space-y-4 p-4">
                <Typography variant="h4" color="black">Recordatorios de turnos</Typography>
                <Switch>Enviar recordatorios de turnos por WhatsApp</Switch>
                <p className="text-sm text-slate-500">Activa esta opcion para enviar recordatorios automaticos a tus clientes antes de sus turnos. Esto puede ayudar a reducir las ausencias y mantener a tus clientes informados sobre sus citas.</p>
                <Select label="Tiempo de anticipacion para enviar el recordatorio" placeholder="Selecciona una opcion">
                    <SelectItem key="1">48hs y 24hs antes</SelectItem>
                    <SelectItem key="2">48hs antes</SelectItem>
                    <SelectItem key="3">24hs antes</SelectItem>
                </Select>
                <p className="text-sm text-slate-500">Recorda que cada recordatorio se descuenta de tu paquete contratado.</p>
            </div>
        </div>
    )
}