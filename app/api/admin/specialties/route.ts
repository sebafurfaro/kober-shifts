import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAllSpecialties, createSpecialty } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  const items = await findAllSpecialties();
  // Include professional count for each specialty
  const { countProfessionalsBySpecialty } = await import("@/lib/db");
  const itemsWithCount = await Promise.all(
    items.map(async (item) => ({
      ...item,
      professionalCount: await countProfessionalsBySpecialty(item.id),
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
  if (!name) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const created = await createSpecialty({ id: randomUUID(), name });
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: "Specialty already exists" }, { status: 409 });
  }
}


