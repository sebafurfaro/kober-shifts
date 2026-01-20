"use client";

import * as React from "react";
import { ThemeProvider, StyledEngineProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { HeroUIProvider } from "@heroui/react";
import { theme } from "./theme";

export function Providers({ children }: { children: React.ReactNode }) {
  // This project uses custom authentication (not NextAuth's useSession)
  // NextAuth is only used for OAuth callbacks at /api/plataforma/[tenantId]/auth/[...nextauth]
  // SessionProvider would try to fetch /api/auth/session which doesn't exist
  // So we don't use SessionProvider at all
  // StyledEngineProvider with injectFirst ensures MUI styles are injected first,
  // allowing Tailwind utilities to override them when needed
  // HeroUIProvider wraps the app to enable HeroUI components and theming
  return (
    <HeroUIProvider>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </StyledEngineProvider>
    </HeroUIProvider>
  );
}


