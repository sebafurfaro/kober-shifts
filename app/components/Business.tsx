"use client";

import { Card, CardHeader, CardBody } from "@heroui/react";
import { ArrowLeftIcon, ArrowRightIcon, BubblesIcon, CarIcon, CrossIcon, PawPrintIcon, SmileIcon, UserStarIcon } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Typography from "./Typography";

export const Business = () => {

    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        align: "start",
        containScroll: "trimSnaps",
    });

    const toPrev = () => emblaApi?.scrollPrev();
    const toNext = () => emblaApi?.scrollNext();
    
    

    const business = [
        {
            icon: <BubblesIcon />,
            color: "text-purple-500",
            bgColor: "bg-purple-100",
            title: "Estudios Creativos",
            list: ["Tatuadores", "Estudios de piercing", "Barberías"],
            description: "Permití que tus clientes reserven online y asegurá tu tiempo con pagos anticipados. Menos cancelaciones, más control.",
        },
        {
            icon: <SmileIcon />,
            color: "text-teal-500",
            bgColor: "bg-teal-100",
            title: "Estética y belleza",
            list: ["Peluquerías", "Centros de estética", "Spa y bienestar"],
            description: "Organizá agendas por servicio y profesional, evitá superposiciones y confirmá turnos automáticamente.",
        },
        {
            icon: <UserStarIcon />,
            color: "text-sky-500",
            bgColor: "bg-sky-100",
            title: "Profesionales independientes",
            list: ["Terapeutas", "Coaches", "Consultores"],
            description: "Una agenda clara, pagos integrados y una imagen profesional para tu negocio.",
        },
        {
            icon: <PawPrintIcon />,
            color: "text-amber-500",
            bgColor: "bg-amber-100",
            title: "Veterinarias y cuidado animal",
            list: ["Veterinarias", "Peluquerías caninas", "Guarderías"],
            description: "Gestioná turnos por servicio, reducí ausencias y mantené toda la información centralizada.",
        },
        {
            icon: <CrossIcon />,
            color: "text-pink-500",
            bgColor: "bg-pink-100",
            title: "Salud y Bienestar",
            list: ["Centros de saludo mental", "Ondotolgia", "Kinesiologia", "Consultorios privados"],
            description: "Organización clara, control de turnos y una experiencia simple para vos y tus pacientes.",
        },
        {
            icon: <CarIcon />,
            color: "text-orange-500",
            bgColor: "bg-orange-100",
            title: "Servicios técnicos",
            list: ["Lavaderos", "Servicios de detailing", "Talleres con turnos"],
            description: "Orden operativo, turnos escalonados, menor fricción con clientes.",
        }
    ]


    return(
        <section className="bg-blue-50 py-24">
            <div className="max-w-7xl mx-auto w-full px-4 md:px-0">
                <div className="flex flex-col items-center justify-center space-y-6">
                    <Typography variant="h2" className="text-center text-primary">
                        Para todo tipo de negocio
                    </Typography>
                </div>
                <div className="hidden lg:grid lg:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto w-full">
                    {business.map((feature) => (
                        <Card key={feature.title} className="bg-white/30 backdrop-blur-sm p-4 rounded-lg shadow hover:shadow-lg hover:bg-white hover:scale-105 transition-all duration-300 border border-slate-100">
                            <CardHeader>
                            <div className="flex flex-col justify-start space-y-4">
                                <div className={`p-2 w-16 h-16 flex items-center justify-center rounded-md ${feature.color} ${feature.bgColor}`}>{feature.icon}</div>
                                <Typography variant="h5" className="text-primary">{feature.title}</Typography>
                            </div>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-4">
                                <ul className="list-disc list-inside text-sm font-medium text-slate-900 space-y-1">
                                {feature.list.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                            <Typography variant="p" className="font-medium! text-slate-900">{feature.description}</Typography>
                            </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
                <div className="block lg:hidden w-full mt-10">
                    <div className="embla relative w-full">
                        <div className="embla__viewport overflow-hidden w-full" ref={emblaRef}>
                            <div className="embla__container flex gap-4 py-3" style={{ backfaceVisibility: "hidden" }}>
                            {business.map((feature) => (
                                <Card key={feature.title} className="embla__slide min-w-0 flex-[0_0_72vw] rounded-lg shadow hover:shadow-lg bg-white border border-slate-100 box-border p-3 transition-all duration-300">
                                    <CardHeader>
                                    <div className="w-full flex flex-col justify-center items-center space-y-2">
                                        <div className={`p-2 w-16 h-16 flex items-center justify-center rounded-md ${feature.color} ${feature.bgColor}`}>{feature.icon}</div>
                                        <h3 className="text-md font-bold text-center text-primary">{feature.title}</h3>
                                    </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="space-y-4">
                                        <ul className="list-none text-center list-inside text-sm font-medium text-slate-900 space-y-1">
                                        {feature.list.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                    <p className="text-sm text-center font-medium text-slate-900">{feature.description}</p>
                                    </div>
                                    </CardBody>
                                </Card>
                            ))}
                            </div>
                        </div>
                        <button onClick={toNext} className="embla__next">
                            <ArrowRightIcon className="text-primary"/>
                        </button>
                        <button onClick={toPrev} className="embla__prev">
                            <ArrowLeftIcon className="text-primary" />
                        </button>
                    </div>
                </div>
                <Typography variant="h4" className="font-medium! text-center text-slate-900 mt-16">Distintos negocios, una misma necesidad: orden y control del tiempo. <br />
                    Elegí el plan según cuánto querés crecer, no según tu rubro.</Typography>
            </div>
        </section>
    )
}