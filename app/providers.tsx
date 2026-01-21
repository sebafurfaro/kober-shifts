"use client";

import * as React from "react";
import { HeroUIProvider } from "@heroui/react";

export function Providers({ children }: { children: React.ReactNode }) {
  // HeroUIProvider wraps the app to enable HeroUI components and theming
  // According to HeroUI docs: https://www.heroui.com/docs/frameworks/nextjs
  return (
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  );
}


