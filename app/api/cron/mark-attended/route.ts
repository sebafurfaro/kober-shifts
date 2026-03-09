import { NextResponse } from "next/server";
import { markConfirmedAsAttendedAfterEnd } from "@/lib/db";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/mark-attended
 * Pasa a "turno tomado" (ATTENDED) los turnos CONFIRMED cuya fecha de fin
 * sea más de 1 hora en el pasado. Debe llamarse periódicamente (ej. cada hora).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV !== "development" && authHeader !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const updated = await markConfirmedAsAttendedAfterEnd(oneHourAgo);
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("[Cron:MarkAttended] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
