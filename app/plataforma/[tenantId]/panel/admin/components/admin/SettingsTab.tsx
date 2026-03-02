import Typography from "@/app/components/Typography"
import { Divider, Input, Select, SelectItem, Slider, Switch, Textarea } from "@heroui/react"

export const SettingsTab = () => {
    return (
        <div className="flex flex-col p-4 space-y-4 bg-white">
            <Typography variant="h4" color="black">Ajustes</Typography>
            <div className="flex flex-col space-y-4">
                <Typography variant="h6" color="black">Porcentaje de la senia</Typography>
                <Slider
                    className="w-full"
                    defaultValue={0}
                    formatOptions={{ style: 'percent' }}
                    label="0%"
                    maxValue={1}
                    minValue={0}
                    step={0.01}
                    showTooltip={true}
                    getValue={(val) => `${Math.round((val as number) * 100)}%`} />
                <Typography variant="p" size="sm" color="gray" opacity={70}>
                    Define el porcentaje del total de la reserva que se cobrará como seña al momento de reservar. Por ejemplo, si el porcentaje es 20% y un cliente reserva un turno de $1000, se le cobrará una seña de $200 al momento de la reserva.
                </Typography>
            </div>
            <Divider />
            <div className="flex flex-col space-y-4">
                <Typography variant="h6">Politica de reembolso</Typography>
                <Textarea placeholder="Escribe la politica de reembolso de tu negocio..." />
                <p className="text-sm text-slate-500">Escribe la politica de reembolso en caso que exista una cancelacion o modificacion de turnos.</p>
            </div>
            <Divider />
            <div className="flex flex-col space-y-4">
                <Typography variant="h6">Confirmacion de turnos</Typography>
                <Switch>Confirmacion manual de turnos</Switch>
                <p className="text-sm text-slate-500">Aplica solo a turnos sin sena. Los turnos con sena se confirman automaticamente al realizar el pago.</p>
            </div>
            <Divider />
            <div className="">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-4">
                        <Input label="Anticipacion minima para reservar" placeholder="1" type="text" endContent={<span className="text-sm text-slate-500">horas</span>} />
                        <p className="text-sm text-slate-500">Tiempo minimo de anticipacion con el que alguien puede reservar un turno. Aumentalo para tener mas tiempo para prepararte para las citas o bajalo para permitir mas reservas de ultimo momento.</p>
                    </div>
                    <div className="flex flex-col space-y-4">
                        <Input label="Anticipacion maxima para reservar" placeholder="30" type="text" endContent={<span className="text-sm text-slate-500">dias</span>} />
                        <p className="text-sm text-slate-500">Tiempo maximo de anticipacion con el que alguien puede reservar un turno a futuro.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}