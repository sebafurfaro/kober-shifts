import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { updateMedicalCoverage, deleteMedicalCoverage, findMedicalCoverageById } from "@/lib/db";
import { randomUUID } from "crypto";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    try {
        const body = await req.json();
        const { name, plans } = body;

        if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const formattedPlans = (plans || []).map((plan: any) => {
            if (typeof plan === 'string') {
                return { id: randomUUID(), name: plan };
            }
            return { id: plan.id || randomUUID(), name: plan.name };
        });

        const result = await updateMedicalCoverage(id, name, formattedPlans);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    try {
        await deleteMedicalCoverage(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
