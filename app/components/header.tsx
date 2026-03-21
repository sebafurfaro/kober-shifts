"use client";

import { Button } from "@heroui/react";
import Logo from "@/app/branding/Logo";
import Link from "next/link";
import React from "react";
import { useState, useEffect } from "react";

const SCROLL_THRESHOLD = 100;

export const Header = () => {
    const [scrolled, setScrolled] = useState(false);

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

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY >= SCROLL_THRESHOLD);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={`py-2 px-4 fixed left-0 right-0 mx-auto w-full z-9990 transition-all duration-300 ${scrolled
                ? "top-0 bg-white max-w-full shadow-md"
                : "top-0 shadow-none bg-white/0 rounded-full md:max-w-3xl md:mx-auto"
                }`}
        >

            <div className="mx-auto w-full max-w-7xl px-2 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between gap-2 sm:gap-4">
                    {/* Logo and desktop menu */}
                    <div className="flex md:flex-1 items-center justify-start sm:items-stretch md:justify-start overflow-hidden">
                        <Link href="/">
                            <div className="flex shrink-0 items-center gap-2">
                                <Logo width={32} height={32} />
                                <h2 className={`text-base font-bold text-center text-white transition-all duration-300 ease-in-out ${scrolled ? "opacity-0" : "opacity-100"}`}>NODO App</h2>
                            </div>
                        </Link>
                        <div className="hidden sm:ml-6 md:block md:mx-auto">
                            <div className="flex gap-6 mt-2">
                                {navItems.map((item) => {
                                    // Si el href comienza con #, usar scroll handler
                                    if (item.href.startsWith("#")) {
                                        return (
                                            <button
                                                key={item.href}
                                                className={`${scrolled ? "text-primary" : "text-white"} relative inline cursor-pointer font-medium before:bg-accent  before:absolute before:-bottom-1 before:block before:h-[2px] before:w-full before:origin-bottom-right before:scale-x-0 before:transition before:duration-300 before:ease-in-out hover:before:origin-bottom-left hover:before:scale-x-100`}
                                                onClick={() => {
                                                    const el = document.getElementById(item.href.slice(1));
                                                    if (el) el.scrollIntoView({ behavior: "smooth" });
                                                }}
                                            >
                                                {item.label}
                                            </button>
                                        );
                                    }
                                    // Si es navegación normal, usar Link
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`${scrolled ? "text-primary" : "text-white"} relative inline cursor-pointer font-medium before:bg-accent  before:absolute before:-bottom-1 before:block before:h-[2px] before:w-full before:origin-bottom-right before:scale-x-0 before:transition before:duration-300 before:ease-in-out hover:before:origin-bottom-left hover:before:scale-x-100`}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div className="relative flex items-center justify-end shrink-0">
                        <Button
                            as={Link}
                            href="https://wa.me/5491173740338?text=Hola, quiero saber más sobre NODO App Turnos"
                            radius="full"
                            variant="solid"
                            color="primary"
                            className="text-xs px-3 sm:text-sm sm:px-4"
                        >
                            <span className="sm:hidden">Comenzar</span>
                            <span className="hidden sm:inline">Comenzar ahora</span>
                        </Button>
                    </div>
                </div>
            </div>

        </header>
    )
}