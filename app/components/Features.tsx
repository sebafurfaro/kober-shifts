import { CalendarIcon, CreditCardIcon, WrenchIcon } from "lucide-react";

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
            icon: <CreditCardIcon />,
            title: "Turnos que se convierten en ingresos",
            description: "Reducí ausencias y asegurá tu tiempo con pagos integrados al momento de la reserva.",
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
                    <h2 className="text-4xl font-bold text-center text-primary">La mejor solución para tu negocio</h2>
                    <p className="text-base font-medium text-center text-slate-900">NODO App Turnos centraliza la gestión de turnos, clientes y cobros en una sola plataforma. <br />
                    Diseñada para adaptarse a cualquier tipo de servicio que trabaje con agenda, sin importar el tamaño ni el rubro.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto w-full">
                    {features.map((feature) => (
                        <div key={feature.title} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all duration-300 space-y-4 border border-slate-100">
                            <div className="flex justify-start">
                                <div className={`${feature.textColor} p-2 w-16 h-16 flex items-center justify-center rounded-md ${feature.bgColor}`}>{feature.icon}</div>
                            </div>
                            <h3 className="text-lg font-bold text-primary">{feature.title}</h3>
                            <p className="text-base font-medium text-slate-900">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}