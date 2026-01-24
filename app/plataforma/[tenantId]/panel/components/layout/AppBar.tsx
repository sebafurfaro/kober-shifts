"use client";

import Logo from "@/app/branding/Logo";
import { Menu, LogOut, User } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface AppBarProps {
    isMobile: boolean;
    mobileDrawerOpen: boolean;
    setMobileDrawerOpen: Dispatch<SetStateAction<boolean>>;
    userName: string;
    logout: () => void;
}

export default function AppBar({
    isMobile,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    userName,
    logout,
}: AppBarProps) {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4 md:px-6 shadow-sm">
            <div className="flex items-center gap-4">
                {isMobile && (
                    <button
                        onClick={() => setMobileDrawerOpen((v) => !v)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        aria-label="Toggle menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}

                <div className="flex items-center gap-2">
                    <Logo width={40} height={40} />
                    <span className="text-xl font-bold text-[#0e5287] hidden md:block">
                        NODO App
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 pr-2">
                        {userName}
                    </span>
                </div>

                <button
                    onClick={logout}
                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-all duration-200"
                    title="Cerrar sesión"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}