import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAllLocations, createLocation } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await findAllLocations(tenantId);
  // Include appointment count for each location
  const { countAppointmentsByLocation } = await import("@/lib/db");
  const itemsWithCount = await Promise.all(
    items.map(async (item) => ({
      ...item,
      appointmentCount: await countAppointmentsByLocation(item.id, tenantId),
    }))
  );

  return NextResponse.json(itemsWithCount);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const street = typeof body.street === "string" ? body.street.trim() : null;
  const streetNumber = typeof body.streetNumber === "string" ? body.streetNumber.trim() : null;
  const floor = typeof body.floor === "string" ? body.floor.trim() : null;
  const apartment = typeof body.apartment === "string" ? body.apartment.trim() : null;
  const postalCode = typeof body.postalCode === "string" ? body.postalCode.trim() : null;
  const country = typeof body.country === "string" ? body.country.trim() : null;
  const province = typeof body.province === "string" ? body.province.trim() : null;
  const neighborhood = typeof body.neighborhood === "string" ? body.neighborhood.trim() : null;
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;

  if (!name || !address) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const created = await createLocation({
    id: randomUUID(),
    tenantId,
    name,
    address,
    street,
    streetNumber,
    floor,
    apartment,
    postalCode,
    country,
    province,
    neighborhood,
    phone,
  });
  return NextResponse.json(created);
}


