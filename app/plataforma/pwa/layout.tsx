import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Turnos Nodo",
  description: "Abriendo la aplicación",
};

export default function PlataformaPwaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
