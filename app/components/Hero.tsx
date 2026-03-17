"use client";

import Link from "next/link";
import Typography from "./Typography";


export const Hero = () => {
    return (
        
      <section className="relative isolate overflow-hidden bg-gray-900">
      <svg
        className="absolute inset-0 -z-10 h-full w-full stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
        aria-hidden="true">
        <defs>
          <pattern id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc" width="200" height="200" x="100%" y="-1"
            patternUnits="userSpaceOnUse">
            <path d="M.5 200V.5H200" fill="none"></path>
          </pattern>
        </defs>
        <svg x="50%" y="-1" className="overflow-visible fill-gray-800/20">
          <path d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
            strokeWidth="0"></path>
        </svg>
        <rect width="100%" height="100%" strokeWidth="0" fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)"></rect>
      </svg>
      <div
          className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]"
          aria-hidden="true">
          <div className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-20"
            style={{clipPath: 'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)'}}>
          </div>
        </div>
        <div className="mt-[-50px] flex h-screen items-center justify-center">
          <div className="max-w-full flex-shrink-0 px-4 text-center lg:mx-0 lg:max-w-3xl lg:pt-8 flex flex-col gap-6">
            <Typography variant="h1" color="white" className="md:text-5xl" data-aos="zoom-in">Nunca fue tan fácil gestionar tus turnos</Typography>
            <Typography variant="h5" color="white" data-aos="zoom-in" data-aos-delay="100">
              En NODO App, creemos que la agenda es el corazón del negocio, no una función premium. Por eso, nuestro plan incluye sin restricciones las herramientas fundamentales para organizarte y crecer.
            </Typography>
            <div className="mt-5 flex items-center justify-center gap-x-6" data-aos="zoom-in" data-aos-delay="200">
              <Link href={"https://wa.me/5491173740338?text=Hola, quiero saber más sobre NODO App Turnos"} className="font-bold text-xl bg-white px-6 py-3 rounded-full relative w-fit">Comenzar ahora</Link>
            </div>
          </div>
        </div>
      </section>
    )
}