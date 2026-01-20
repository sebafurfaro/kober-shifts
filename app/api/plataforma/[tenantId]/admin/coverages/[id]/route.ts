import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { updateMedicalCoverage, deleteMedicalCoverage, findMedicalCoverageById } from "@/lib/db";
import { randomUUID } from "crypto";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
    const { id, tenantId } = await params;
    const session = await getSession();
    if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const body = await req.json();
        const { name, plans } = body;

        if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const formattedPlans = (plans || []).map((plan: any) => {
            if (typeof plan === 'string') {
                return { id: randomUUID(), tenantId, name: plan };
            }
            return { id: plan.id || randomUUID(), tenantId, name: plan.name };
        });

        const result = await updateMedicalCoverage(id, tenantId, name, formattedPlans);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
    const { id, tenantId } = await params;
    const session = await getSession();
    if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        await deleteMedicalCoverage(id, tenantId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
