"use client";

import { HeroUIProvider } from "@heroui/react";

export function StoreThemeProvider({ children }: { children: React.ReactNode }) {
  // Using HeroUIProvider for consistent theming across the app
  return (
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  );
}
