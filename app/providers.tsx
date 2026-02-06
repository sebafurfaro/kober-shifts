"use client";

import * as React from "react";
import { HeroUIProvider } from "@heroui/react";
import { setLocalTimeZone } from "@internationalized/date";
import { BUENOS_AIRES_TIMEZONE } from "@/lib/timezone";

export function Providers({ children }: { children: React.ReactNode }) {
  // Calendario y date pickers: zona horaria Buenos Aires y español
  React.useEffect(() => {
    setLocalTimeZone(BUENOS_AIRES_TIMEZONE);
  }, []);

  // HeroUIProvider: locale es-AR para que calendarios y DatePickers estén en español (Argentina)
  return (
    <HeroUIProvider locale="es-AR">
      {children}
    </HeroUIProvider>
  );
}


