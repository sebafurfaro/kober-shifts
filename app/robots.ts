import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots{
    return{
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/plataforma/", "/api/", "/store/"]
        },
        sitemap: "https://turnos.nodoapp.com.ar/sitemap.xml"
    }
}