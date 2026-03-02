import { Button } from "@heroui/react";
import { CircleArrowRight } from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Link from "next/link";

export const Hero = () => {
    return (
        <section className="bg-linear-to-b from-blue-200 via-blue-50 to-white py-24">
        <div className="max-w-6xl mx-auto w-full px-4 md:px-0 space-y-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="col-span-1 space-y-6">
            <div className="flex items-center justify-between w-fit px-4 py-2 bg-white rounded-md space-x-1 shadow">
              <span className="text-base font-semibold text-[#1497B5]">Bienvenidos a</span>
              <h2 className="text-base font-bold text-center text-slate-900">NODO <span className="bg-linear-to-r from-primary via-accent to-accent-third bg-clip-text text-transparent">App</span> </h2>
              <span className="text-base font-semibold text-primary">Turnos</span>
            </div>
            <div className="max-w-xl w-full mr-auto">
              <h1 className="text-4xl font-bold text-primary">Nunca fue tan fácil gestionar tus turnos</h1>
            </div>
            <div className="max-w-xl w-full mr-auto">
              <p className="text-base font-medium text-slate-900">En NODO App, creemos que la agenda es el corazón del negocio, no una función premium. Por eso, nuestro plan incluye sin restricciones las herramientas fundamentales para organizarte y crecer. </p>
            </div>
            <div className="max-w-md w-full mr-auto gap-8">
              <Button as={Link} href="https://wa.me/5491173740338?text=Hola, quiero saber más sobre NODO App Turnos" variant="solid" color="primary" startContent={<CircleArrowRight />}>Comenzar ahora</Button>
            </div>
          </div>
          <div className="col-span-1">
            <DotLottieReact src="/online-chat.lottie" loop autoplay width={400} height={400} />
          </div>
        </div>
      </section>
    )
}