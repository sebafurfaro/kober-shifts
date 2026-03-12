import { CalendarIcon, LinkIcon, WrenchIcon } from "lucide-react";
import { Typography } from "./Typography";

export const Features = () => {


    const features = [
        {
            icon: <CalendarIcon />,
            title: "Agenda inteligente y sin límites",
            description: "Organizá tu disponibilidad con vistas mensual, semanal y diaria, pensadas para una operación clara y sin errores.",
            bgColor: "bg-red-200/40",
            textColor: "text-red-900",
        },
        {
            icon: <LinkIcon />,
            title: "Link personalizado a tu agenda",
            description: "Crea un link personlizado a la agenda de turnos para postear en redes o compartirlo desde donde desees.",
            bgColor: "bg-green-200/40",
            textColor: "text-green-900",
        },
        {
            icon: <WrenchIcon />,
            title: "Se adapta a tu forma de trabajar",
            description: "NodoApp no impone un modelo único: se configura según tu negocio.",
            bgColor: "bg-yellow-200/40",
            textColor: "text-yellow-900",
        },
    ]


    return (
        <section className="py-8 relative">
            <div className="max-w-7xl mx-auto w-full px-4 md:px-0">
                <div className="flex flex-col items-center justify-center space-y-6">
                    <Typography variant="h2" className="text-primary">La mejor solución para tu negocio</Typography>
                    <Typography variant="p" color="black" className="font-semibold text-center">
                        NODO App Turnos centraliza la gestión de turnos, clientes y cobros en una sola plataforma. <br />
                        Diseñada para adaptarse a cualquier tipo de servicio que trabaje con agenda, sin importar el tamaño ni el rubro.
                    </Typography>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto w-full">
                    {features.map((feature) => (
                        <div key={feature.title} className="bg-white p-6 rounded-lg shadow hover:shadow-lg hover:scale-105 transition-all duration-300 space-y-4 border border-slate-100">
                            <div className="flex justify-start">
                                <div className={`${feature.textColor} p-2 w-16 h-16 flex items-center justify-center rounded-md ${feature.bgColor}`}>{feature.icon}</div>
                            </div>
                            <Typography variant="h3" className="text-lg font-bold text-primary">
                                {feature.title}
                            </Typography>
                            <Typography variant="p" color="black" className="font-medium text-slate-900">
                                {feature.description}
                            </Typography>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}