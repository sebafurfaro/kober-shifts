import { NextResponse } from "next/server";
import { getStyleConfig, upsertStyleConfig } from "@/lib/styleConfig";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const config = await getStyleConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error loading style-config:", error);
    // Return default config if database is unavailable
    const defaultConfig = {
      branding: {
        siteName: "Kober Shifts",
        address: {},
        socials: {},
      },
      colors: {
        primary: "#1976d2",
        secondary: "#9c27b0",
        accent: "#00bcd4",
        background: "#ffffff",
        text: "#171717",
        links: "#1976d2",
        linksHover: "#115293",
      },
      borders: {
        borderWidth: 1,
        borderRadius: 12,
      },
      sections: {
        showLocations: false,
        showSpecialties: true,
      },
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(defaultConfig);
  }
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await req.json().catch(() => ({}))) as any;

    // Accept full or partial nested objects; defaults/merge handled in upsertStyleConfig.
    const config = await upsertStyleConfig({
      branding: body?.branding,
      colors: body?.colors,
      borders: body?.borders,
      sections: body?.sections,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error updating style-config:", error);
    return NextResponse.json(
      { error: "No se pudo guardar la configuración. La base de datos puede no estar disponible." },
      { status: 500 }
    );
  }
}


