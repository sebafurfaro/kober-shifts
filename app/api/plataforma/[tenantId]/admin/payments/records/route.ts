import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { mongoClientPromise } from "@/lib/mongo";
import { Role } from "@/lib/types";

export async function GET(
  req: Request,
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

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const skip = (safePage - 1) * safeLimit;

    const client = await mongoClientPromise;
    const db = client.db();
    const collection = db.collection("payments");

    const total = await collection.countDocuments({ tenantId });
    const payments = await collection
      .find({ tenantId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .toArray();

    return NextResponse.json({
      payments,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching payments records:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments records" },
      { status: 500 }
    );
  }
}
