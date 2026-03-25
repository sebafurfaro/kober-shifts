import { NextResponse } from "next/server";

/**
 * Proxy hacia Argentina Datos (feriados nacionales). Evita CORS en el cliente y cachea 24h.
 * GET /api/argentina-feriados/[year]
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const { year } = await params;
  if (!/^\d{4}$/.test(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }
  const y = parseInt(year, 10);
  if (y < 2000 || y > 2100) {
    return NextResponse.json({ error: "Year out of range" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.argentinadatos.com/v1/feriados/${year}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "No se pudieron obtener los feriados" },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("argentina-feriados proxy:", e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 502 });
  }
}
