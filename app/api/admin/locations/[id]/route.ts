import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findLocationById, updateLocation } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const location = await findLocationById(id);
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  return NextResponse.json(location);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  
  const location = await findLocationById(id);
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!address) return NextResponse.json({ error: "Address is required" }, { status: 400 });

  try {
    const updatedLocation = await updateLocation(id, { name, address, phone });
    return NextResponse.json(updatedLocation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update location" }, { status: 500 });
  }
}

