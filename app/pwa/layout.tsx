import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Turnos Nodo",
  description: "Abriendo la aplicación",
};

export default function PwaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
