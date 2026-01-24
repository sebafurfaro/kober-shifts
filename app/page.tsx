"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Card, CardBody, Switch } from "@heroui/react";
import { Menu, X } from "lucide-react";
import Logo from "@/app/branding/Logo";

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
      title: "Plan Inicial",
      label: "Crecimiento",
      target: "Consultorios particulares o emprendedores",
      location: "1",
      professionals: "2",
      patients: "Ilimitados",
      price: "15.000",
      priceYear: "150.000"
    },
    {
      title: "Plan Profesional",
      label: "Mas vendido",
      target: "Centros medicos medianos o esteticas",
      location: "1",
      professionals: "5",
      patients: "Ilimitados",
      price: "32.100",
      priceYear: "321.000"
    },
    {
      title: "Plan Corporativo",
      label: "Grandes beneficios",
      target: "Clinicas con multiples especialidades",
      location: "Hasta 5 sedes",
      professionals: "10",
      patients: "Ilimitados",
      price: "55.000",
      priceYear: "550.000"
    }
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="rounded-full py-2 px-4 fixed top-8 left-0 right-0 mx-auto max-w-7xl w-full bg-white/50 backdrop-blur-sm z-9990 shadow-lg">
        <nav className="relative after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10">
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <Button
                  isIconOnly
                  variant="light"
                  onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="size-6" />
                  ) : (
                    <Menu className="size-6" />
                  )}
                </Button>
              </div>

              {/* Logo and desktop menu */}
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex shrink-0 items-center gap-2">
                  <Logo width={32} height={32} />
                  <h2 className="text-base font-bold text-center text-black">NODO <span className="bg-linear-to-r from-[#1A237E] via-[#1497B5] to-[#26A69A] bg-clip-text text-transparent">App</span> </h2>
                </div>
                <div className="hidden sm:ml-6 sm:block md:mx-auto">
                  <div className="flex space-x-4">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="text-[#1A237E] hover:text-[#1497B5] transition-colors duration-300 font-medium"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right side actions */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                
                <Button as={Link} href="/register" className="button button-secondary rounded-full!">
                  Comenzar ahora!
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="block sm:hidden">
              <div className="space-y-1 px-2 pt-2 pb-3 border-t border-white/10">
                <Link
                  href="#"
                  className="block rounded-md bg-gray-950/50 px-3 py-2 text-base font-medium text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="#"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Team
                </Link>
                <Link
                  href="#"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Projects
                </Link>
                <Link
                  href="#"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Calendar
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>
      <section className="bg-white p-2">
      <div className="rounded-4xl ring-1 ring-black/5 ring-inset bg-linear-115 from-[#fff1be] from-28% via-[#ee87cb] via-70% to-[#b060ff] sm:bg-linear-145 h-screen md:h-fit w-full md:min-h-[600px]">
        <div className="md:max-w-7xl mx-auto md:text-left  md:py-32">
          <h1 className="text-6xl/[1.2] font-primary font-semibold tracking-tight text-balance text-gray-950">Tu agenda, organizada. <br /> Tu tiempo, recuperado.</h1>
          <p className="mt-8 max-w-lg text-base font-primary font-medium text-gray-950/75 mb-4">Con NodoApp Turnos, gestioná tus turnos de forma inteligente. Automatizá recordatorios, evitá ausencias y brindá a tus pacientes la experiencia digital que esperan.</p>
          <Button as={Link} href="/register" className="button button-secondary rounded-full! w-fit">Comenzar ahora!</Button>
          </div>
        </div>
      </section>
      <section className="py-32">
        <h2 className="text-4xl font-semibold text-gray-950 mb-8">Precios</h2>
        <div className="flex items-center gap-2 mb-8">
          <div 
            className="relative inline-flex items-center rounded-lg border border-gray-700 bg-gray-800/50 p-1 cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => setIsSelected(!isSelected)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsSelected(!isSelected);
              }
            }}
          >
            <div className="relative flex">
              <span 
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 z-10 cursor-pointer ${
                  !isSelected ? 'text-white' : 'text-gray-400'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSelected(false);
                }}
              >
                Mensual
              </span>
              <span 
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 z-10 cursor-pointer ${
                  isSelected ? 'text-white' : 'text-gray-400'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSelected(true);
                }}
              >
                Anual
              </span>
              <div
                className={`absolute top-1 bottom-1 rounded-md transition-all duration-200 ${
                  isSelected 
                    ? 'left-1/2 right-1 bg-[#9333ea]' 
                    : 'left-1 right-1/2 bg-[#9333ea]'
                }`}
                style={{
                  width: 'calc(50% - 4px)'
                }}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricing.map((item) => (
            <Card key={item.title} className="bg-white p-6 rounded-lg">
              <CardBody>
              <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
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
    </div>
  );
}
