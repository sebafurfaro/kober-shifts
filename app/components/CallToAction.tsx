import Link from "next/link";
import Typography from "./Typography";
import { BookOpenCheckIcon, BotOffIcon, HeadsetIcon } from "lucide-react";
import { Button } from "@heroui/react";
import { WhatsappIcon } from "../branding/WhatsappIcon";

export const CallToAction = () => {

    const supportList = [
        {
            title: "Atencion personalizada",
            icon: <HeadsetIcon className="text-white w-4 h-4" />
        },
        {
            title: "Soporte por Whatsapp",
            icon: <WhatsappIcon className="text-white w-4 h-4" />
        },
        {
            title: "Sin bots, siempre humanos",
            icon: <BotOffIcon className="text-white w-4 h-4" />
        },
        {
            title: "Respuestas reales",
            icon: <BookOpenCheckIcon className="text-white w-4 h-4" />
        }
    ]

    return (
        <section className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-32">
            <div className="max-w-5xl mx-auto w-full px-4">
                <div className="border border-white/10 rounded-4xl bg-white/10">
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col space-y-3">
                                <Typography variant="h4" color="white">Soporte humano 24/7</Typography>
                                <Typography variant="p" color="white">Contas con una persona para que te asesora con lo que necesites, cuando lo necesites.</Typography>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                                    {supportList.map((item, index) => (
                                        <div className="flex items-center gap-2" key={index}>
                                            {item.icon}
                                            <Typography variant="p" color="white" className="text-sm">{item.title}</Typography>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="border border-white/10 bg-white/10 rounded-4xl">
                                <div className="p-8 flex flex-col gap-4">
                                    <Typography variant="p" color="white">Te ayudamos a cambiar de agenda, estamos para vos. No dudes en contactarnos.</Typography>
                                    <Button 
                                        href="https://wa.me/5491173740338?text=Hola, quiero saber más sobre NODO App Turnos"
                                        as={Link}
                                        target="_blank"
                                        variant="solid"
                                        radius="none"
                                        color="success"
                                        className="w-fit flex gap-3"
                                    >
                                        <WhatsappIcon className="h-5 w-5 text-white" />
                                        <span className="text-white">Contactanos por Whatsapp</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}