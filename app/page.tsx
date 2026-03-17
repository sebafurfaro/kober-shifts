"use client";

import * as React from "react";
import { useEffect } from "react";
import AOS from "aos";
import { Header } from "./components/header";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Dashboard } from "./components/Dashboard";
import { Plans } from "./components/Plans";
import { Footer } from "./components/Footer";
import { CallToAction } from "./components/CallToAction";
import "aos/dist/aos.css";

export default function Home() {

  useEffect(() => {
  const timer = setTimeout(() => {
    AOS.init({
      duration: 600,
      once: true,
      easing: "ease-out",
      offset: 80,
    });
  }, 50);
  return () => clearTimeout(timer);
}, []);

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
