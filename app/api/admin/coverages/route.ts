import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAllMedicalCoveragesWithPlans, createMedicalCoverage } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const coverages = await findAllMedicalCoveragesWithPlans();
        return NextResponse.json(coverages);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const body = await req.json();
        const { name, plans } = body;

        if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const coverageId = randomUUID();
        const formattedPlans = (plans || []).map((plan: any) => ({
            id: plan.id || randomUUID(),
            name: typeof plan === 'string' ? plan : plan.name
        }));

        const result = await createMedicalCoverage({
            id: coverageId,
            name,
            plans: formattedPlans
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
