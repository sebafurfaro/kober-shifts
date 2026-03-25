import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Turnos Nodo App",
    short_name: "Turnos Nodo",
    description: "Nunca fue tan fácil gestionar tus turnos",
    /** Entrada PWA sin pasar por la home de marketing (`/pwa` redirige a panel o login del tenant). */
    start_url: "/pwa",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0369a1",
    orientation: "any",
    lang: "es",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
