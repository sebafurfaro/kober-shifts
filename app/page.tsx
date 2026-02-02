"use client";

import * as React from "react";
import { Header } from "./components/header";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Dashboard } from "./components/Dashboard";
import { Business } from "./components/Business";
import { Plans } from "./components/Plans";
import  PackCalculator from "./components/PackCalculator";

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
      <PackCalculator />
    </div>
  );
}
