"use client";

import * as React from "react";
import { Header } from "./components/header";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Dashboard } from "./components/Dashboard";
import { Business } from "./components/Business";
import { Plans } from "./components/Plans";
import Typography from "./components/Typography";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  

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


  return (
    <div className="min-h-screen bg-white font-primary w-full">
      <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} navItems={navItems} />
      <Hero />
      <Features />
      <Dashboard />
      <Business />
      <Plans />
      <footer className="w-full bg-primary">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:grid md:grid-cols-2 items-center">
            <Typography variant="h5" color="white" className="font-bold!">NODO App</Typography>
          </div>
          <ul className="flex items-center gap-4">
            <li><a href="/terminos">Terminos y Condiciones</a></li>
            <li><a href="/politicas">Politicas de privacidad</a></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
