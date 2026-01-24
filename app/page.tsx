"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Card, CardBody, Chip } from "@heroui/react";
import { Header } from "./components/header";
import { CustomSwitch } from "./components/CustomSwitch";
import { CallToAction } from "./components/CallToAction";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isSelected, setIsSelected] = React.useState(false);

  const navItems = [
    {
      label: "Precios",
      href: "#precios"
    },
    {
      label: "Beneficios",
      href: "#beneficios"
    }
  ]

  const pricing = [
    {
      title: "Inicial",
      label: "Crecimiento",
      target: "Consultorios particulares o emprendedores",
      location: "1",
      professionals: "2",
      patients: "Ilimitados",
      price: "15.000",
      priceYear: "150.000",
      recommended: false
    },
    {
      title: "Profesional",
      label: "Mas vendido",
      target: "Centros medicos medianos o esteticas",
      location: "1",
      professionals: "5",
      patients: "Ilimitados",
      price: "32.100",
      priceYear: "321.000",
      recommended: false
    },
    {
      title: "Corporativo",
      label: "Grandes beneficios",
      target: "Clinicas con multiples especialidades",
      location: "Hasta 5 sedes",
      professionals: "10",
      patients: "Ilimitados",
      price: "55.000",
      priceYear: "550.000",
      recommended: true
    }
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white font-primary">
      <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} navItems={navItems} />

      <section className="bg-white p-2">
        <div className="rounded-4xl ring-1 ring-black/5 ring-inset bg-linear-115 from-[#fff1be] from-28% via-[#ee87cb] via-70% to-[#b060ff] sm:bg-linear-145 h-screen md:h-fit w-full md:min-h-[600px]">
          <div className="md:max-w-7xl mx-auto md:text-left  md:py-32">
            <h1 className="text-6xl/[1.2] font-primary font-semibold tracking-tight text-balance text-gray-950">Tu agenda, organizada. <br /> Tu tiempo, recuperado.</h1>
            <p className="mt-8 max-w-lg text-base font-primary font-medium text-gray-950/75 mb-4">Con NodoApp Turnos, gestioná tus turnos de forma inteligente. Automatizá recordatorios, evitá ausencias y brindá a tus pacientes la experiencia digital que esperan.</p>
            <Button as={Link} href="/register" className="button button-secondary rounded-full! w-fit">Comenzar ahora!</Button>
          </div>
        </div>
      </section>
      <section className="py-32 px-8">
        <h2 className="text-4xl font-semibold text-gray-950 mb-8 text-center">Precios</h2>
        <div className="flex items-center justify-center gap-2 mb-8">
          <CustomSwitch isSelected={isSelected} setIsSelected={setIsSelected} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:max-w-5xl md:mx-auto">
          {pricing.map((item, index) => (
            <Card key={index} className="bg-white/80 p-4 rounded-lg backdrop-blur-sm">
              <CardBody>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                  {item.recommended && <Chip color="secondary" variant="flat">Popular</Chip>}
                </div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="text-sm text-gray-500">{isSelected ? item.priceYear : item.price}</p>
                <p className="text-sm text-gray-500">{item.target}</p>
                <p className="text-sm text-gray-500">{item.location}</p>
                <p className="text-sm text-gray-500">{item.professionals}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
      <CallToAction />
    </div>
  );
}
