"use client";

import { Button } from "@heroui/react";
import { Menu, X } from "lucide-react";
import Logo from "@/app/branding/Logo";
import Link from "next/link";
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
                        <div className="relative inset-y-0 right-0 flex items-center sm:hidden order-2">
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
                        <div className="flex flex-1 items-center justify-start sm:items-stretch md:justify-start">
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
                        <div className="absolute inset-y-0 right-0 hidden md:flex items-center pr-2 md:static sm:inset-auto sm:ml-6 sm:pr-0">

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
    )
}