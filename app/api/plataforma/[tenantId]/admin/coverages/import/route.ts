import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { seedCoveragesFromList, findAllMedicalCoveragesWithPlans } from "@/lib/db";
import { coberturas } from "@/lib/coverage";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getSession();
    if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const before = await findAllMedicalCoveragesWithPlans(tenantId);
        const beforeNames = new Set(before.map(c => c.name.toLowerCase().trim()));

        await seedCoveragesFromList(tenantId, coberturas);

        const after = await findAllMedicalCoveragesWithPlans(tenantId);
        const imported = after.filter(c => !beforeNames.has(c.name.toLowerCase().trim())).length;
        const skipped = coberturas.filter(c => c.title && beforeNames.has(c.title.toLowerCase().trim())).length;

        return NextResponse.json({ success: true, imported, skipped });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
