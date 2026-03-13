import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    return[
        {
            url: "https://turnos.nodoapp.com.ar",
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 1
        }
    ]
}