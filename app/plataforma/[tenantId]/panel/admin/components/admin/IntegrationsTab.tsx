import { PaymentsForm } from "../../payments/components/PaymentsForm";
import { Card, Button } from "@heroui/react";
import Typography from "@/app/components/Typography";
import Image from "next/image";

export const IntegrationsTab = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 bg-white">
            <PaymentsForm />
            <div className="w-full">
                <Card className="p-4 flex flex-col items-start space-y-4 shadow-none border border-gray-200">
                    <Image src="/isologo_wsp.png" alt="WhatsApp" width={60} height={60} />
                    <Typography variant="h4" color="black" >Whatsapp</Typography>
                    <Typography variant="p" color="gray" opacity={70}>
                        Activa esta opcion para enviar recordatorios automaticos a tus clientes antes de sus turnos. 
                    </Typography>
                    <Button variant="solid" color="primary" className="w-full">Activar</Button>
                </Card>
            </div>
        </div>
    );
};