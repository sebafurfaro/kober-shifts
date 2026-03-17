"use client";

import { useRef, MouseEvent } from "react";
import { Typography } from "./Typography";

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
}

function BentoCard({ children, className = "" }: BentoCardProps) {
  const spotlightRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (spotlightRef.current) {
      spotlightRef.current.style.left = `${x}px`;
      spotlightRef.current.style.top = `${y}px`;
    }
  };

  const handleMouseEnter = () => {
    if (spotlightRef.current) spotlightRef.current.style.opacity = "1";
  };

  const handleMouseLeave = () => {
    if (spotlightRef.current) spotlightRef.current.style.opacity = "0";
  };

  return (
    <div
      className={`relative overflow-hidden border border-white/10 bg-white/10 transition-all duration-300 ease-in-out cursor-pointer hover:border-accent/30 flex items-center justify-center ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Spotlight */}
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-0 transition-opacity duration-150"
        style={{
          background: "radial-gradient(circle, rgba(var(--accent-rgb, 120,100,255), 0.15) 0%, transparent 70%)",
        }}
      />

      {children}
    </div>
  );
}

export const Features = () => {
  return (
    <section className="pt-18 pb-32 relative bg-gradient-to-b from-gray-900 to-gray-800" id="beneficios">
      <div className="max-w-7xl mx-auto w-full px-4 md:px-0">

        {/* Header */}
        <div className="flex flex-col gap-6 items-center">
          <div className="border border-accent p-1 w-60 mx-auto rounded-full flex items-center justify-between mb-4">
            <Typography variant="p" color="white" className="font-inter font-medium! ml-3">
              NODO App Turnos
            </Typography>
            <div className="w-8 h-8 rounded-full flex justify-center items-center bg-accent">
              <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2.83398 8.00019L12.9081 8.00019M9.75991 11.778L13.0925 8.44541C13.3023 8.23553 13.4073 8.13059 13.4073 8.00019C13.4073 7.86979 13.3023 7.76485 13.0925 7.55497L9.75991 4.22241"
                  stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <Typography variant="h1" color="white" className="text-center">La mejor solución para tu negocio</Typography>
          <Typography variant="p" color="white" className="text-center">
            NODO App Turnos centraliza la gestión de turnos, clientes y cobros en una sola plataforma.<br />
            Diseñada para adaptarse a cualquier tipo de servicio que trabaje con agenda, sin importar el tamaño ni el rubro.
          </Typography>
        </div>

        {/* Bento Grid */}
        <div className="w-full max-w-5xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-4">

          {/* Card 1 — col 1, row-span-2 */}
          <BentoCard className="rounded-xl lg:rounded-l-4xl lg:rounded-r-xl lg:row-span-2">
            <div className="p-8 flex flex-col gap-4">
              <Typography variant="h3" color="white">Link personalizado a tu agenda</Typography>
              <Typography variant="p" color="white">
                Crea un link personalizado a la agenda de turnos para postear en redes o compartirlo desde donde desees.
              </Typography>
            </div>
          </BentoCard>

          {/* Card 2 — col 2-3, row 1 */}
          <BentoCard className="rounded-xl lg:col-span-2 lg:rounded-l-xl lg:rounded-tr-4xl lg:rounded-br-xl">
            <div className="p-8 flex flex-col gap-4">
              <Typography variant="h4" color="white">Agenda inteligente y sin límites</Typography>
              <Typography variant="p" color="white">
                Organizá tu disponibilidad con vistas mensual, semanal y diaria, pensadas para una operación clara y sin errores.
              </Typography>
            </div>
          </BentoCard>

          {/* Card 3 — col 2-3, row 2 */}
          <BentoCard className="rounded-xl lg:col-span-2 lg:col-start-2 lg:row-start-2 lg:rounded-l-xl lg:rounded-tr-xl lg:rounded-br-4xl">
            <div className="p-8 flex flex-col gap-4">
              <Typography variant="h4" color="white">Se adapta a tu forma de trabajar</Typography>
              <Typography variant="p" color="white">
                NodoApp no impone un modelo único: se configura según tu negocio.
              </Typography>
            </div>
          </BentoCard>

        </div>
      </div>
    </section>
  );
};