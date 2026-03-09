import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { Role } from "@/lib/types";
import { getPermissions, setPermissions } from "@/lib/permissions-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const permissions = await getPermissions(tenantId);
  return NextResponse.json({ permissions });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: { permissions?: Record<string, Record<string, number>> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const permissions = body.permissions;
  if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) {
    return NextResponse.json({ error: "permissions required" }, { status: 400 });
  }
  await setPermissions(tenantId, permissions);
  return NextResponse.json({ success: true });
}
