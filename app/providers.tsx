"use client";

import * as React from "react";
import { ThemeProvider } from "@mui/material/styles";
import { SessionProvider } from "next-auth/react";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SessionProvider>
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}


