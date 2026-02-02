import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findLocationById, updateLocation, deleteLocation } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const location = await findLocationById(id, tenantId);
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  return NextResponse.json(location);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const location = await findLocationById(id, tenantId);
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

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

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!address) return NextResponse.json({ error: "Address is required" }, { status: 400 });

  try {
    const updatedLocation = await updateLocation(id, tenantId, {
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
    return NextResponse.json(updatedLocation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update location" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const location = await findLocationById(id, tenantId);
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  try {
    await deleteLocation(id, tenantId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete location" }, { status: 500 });
  }
}

