"use client";

import * as React from "react";
import { Header } from "./components/header";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Dashboard } from "./components/Dashboard";
import { Plans } from "./components/Plans";
import { Footer } from "./components/Footer";
import { CallToAction } from "./components/CallToAction";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-primary w-full">
      <Header />
      <Hero />
      <Features />
      <Dashboard />
      <CallToAction />
      <Plans />
      <Footer />
    </div>
  );
}
