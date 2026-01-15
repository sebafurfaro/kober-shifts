import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAllLocations, createLocation } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  const items = await findAllLocations();
  // Include appointment count for each location
  const { countAppointmentsByLocation } = await import("@/lib/db");
  const itemsWithCount = await Promise.all(
    items.map(async (item) => ({
      ...item,
      appointmentCount: await countAppointmentsByLocation(item.id),
    }))
  );
  
  return NextResponse.json(itemsWithCount);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;

  if (!name || !address) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const created = await createLocation({ id: randomUUID(), name, address, phone });
  return NextResponse.json(created);
}


