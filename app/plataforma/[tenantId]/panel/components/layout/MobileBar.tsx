"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookUser,
  Calendar,
  CalendarCheck2,
  CalendarDays,
  LayoutGrid,
  Settings,
  User,
} from "lucide-react";
import type { AsideNavKey, MobileNavEntry } from "@/lib/panel-mobile-nav";
import type { Dispatch, SetStateAction } from "react";

function iconForNavKey(key: AsideNavKey | "menu"): React.ReactNode {
  const className = "w-6 h-6";
  switch (key) {
    case "analytics":
      return <BarChart3 className={className} />;
    case "calendar":
      return <Calendar className={className} />;
    case "professional":
      return <CalendarCheck2 className={className} />;
    case "patients":
      return <BookUser className={className} />;
    case "admin":
      return <Settings className={className} />;
    case "patient-mis-turnos":
      return <CalendarDays className={className} />;
    case "patient-mis-datos":
      return <User className={className} />;
    case "menu":
      return <LayoutGrid className={className} />;
    default:
      return <LayoutGrid className={className} />;
  }
}

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBar({
  entries,
  setMobileDrawerOpen,
}: {
  entries: MobileNavEntry[];
  setMobileDrawerOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-slate-200 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
      <div className="flex w-full max-w-lg mx-auto">
        {entries.map((entry, index) => {
          if (entry.kind === "menu") {
            return (
              <div className="flex-1 min-w-0 group" key={`menu-${index}`}>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="flex flex-col items-center justify-end text-center w-full px-1 pt-2 pb-1 text-slate-500 hover:text-[#0288D1] transition-colors duration-200"
                  aria-label="Abrir menú"
                >
                  <span className="text-[#0288D1]">{iconForNavKey("menu")}</span>
                  <span className="text-xs font-medium mt-0.5 leading-tight">Menú</span>
                  <span className="mt-1 block w-5 h-1 rounded-full bg-transparent group-hover:bg-[#0288D1]/40 group-focus-visible:bg-[#0288D1]/40" />
                </button>
              </div>
            );
          }

          const active = isActive(pathname, entry.href, entry.exact);
          return (
            <div className="flex-1 min-w-0 group" key={`${entry.key}-${entry.href}`}>
              <Link
                href={entry.href}
                className={`flex flex-col items-center justify-end text-center w-full px-1 pt-2 pb-1 transition-colors duration-200 ${
                  active ? "text-[#0288D1]" : "text-slate-500 hover:text-[#0288D1]"
                }`}
              >
                <span className={active ? "text-[#0288D1]" : "text-slate-500"}>
                  {iconForNavKey(entry.key)}
                </span>
                <span
                  className={`text-xs font-medium mt-0.5 leading-tight line-clamp-2 ${
                    active ? "font-semibold text-[#0288D1]" : ""
                  }`}
                >
                  {entry.label}
                </span>
                <span
                  className={`mt-1 block w-5 h-1 rounded-full transition-colors ${
                    active ? "bg-[#0288D1]" : "bg-transparent group-hover:bg-[#0288D1]/30"
                  }`}
                />
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
