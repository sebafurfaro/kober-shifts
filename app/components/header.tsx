"use client";

import { Button } from "@heroui/react";
import { Menu, X } from "lucide-react";
import Logo from "@/app/branding/Logo";
import Link from "next/link";
import React from "react";
import { useState, useEffect } from "react";

const SCROLL_THRESHOLD = 100;

export const Header = ({ mobileMenuOpen, setMobileMenuOpen, navItems }: { mobileMenuOpen: boolean, setMobileMenuOpen: (open: boolean) => void, navItems: { label: string, href: string }[] }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY >= SCROLL_THRESHOLD);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={`py-2 px-4 fixed left-0 right-0 mx-auto w-full z-9990 transition-all duration-300 ${
                scrolled
                    ? "top-0 bg-linear-to-b from-white/20 to-transparent backdrop-blur-md max-w-full shadow-none"
                    : "top-4 shadow-none bg-white/10 border border-slate-100 rounded-full md:max-w-3xl md:mx-auto"
            }`}
        >
            <nav className="">
                <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                    <div className="relative flex h-16 items-center justify-between">
                        {/* Logo and desktop menu */}
                        <div className="flex flex-1 items-center justify-start sm:items-stretch md:justify-start">
                            <Link href="/">
                                <div className="flex shrink-0 items-center gap-2">
                                    <Logo width={32} height={32} />
                                    <h2 className="text-base font-bold text-center text-black">NODO <span className="bg-linear-to-r from-[#1A237E] via-[#1497B5] to-[#26A69A] bg-clip-text text-transparent">App</span> </h2>
                                </div>
                            </Link>
                            <div className="hidden sm:ml-6 sm:block md:mx-auto">
                                <div className="flex space-x-4">
                                    {navItems.map((item) => {
                                        // Si el href comienza con #, usar scroll handler
                                        if (item.href.startsWith("#")) {
                                            return (
                                                <button
                                                    key={item.href}
                                                    className="text-[#1A237E] hover:text-[#1497B5] transition-colors duration-300 font-medium bg-transparent border-none cursor-pointer"
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
                                                className="text-[#1A237E] hover:text-[#1497B5] transition-colors duration-300 font-medium"
                                            >
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right side actions */}
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 md:static sm:inset-auto sm:ml-6 sm:pr-0">

                            <Button as={Link} href="https://wa.me/5491173740338?text=Hola, quiero saber más sobre NODO App Turnos" variant="solid" radius="full" color="primary">
                                Comenzar ahora!
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}