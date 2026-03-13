import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAllMedicalCoveragesWithPlans, seedCoveragesFromList, createMedicalCoverage } from "@/lib/db";
import { randomUUID } from "crypto";
import { coberturas } from "@/lib/coverage";

export async function GET(
    req: Request,
    context: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await context.params;
    const session = await getSession();
    if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL" && session.role !== "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        // Intento de sync bulk (3 queries en lugar de N×175). Si falla, continúa igual.
        try {
            await seedCoveragesFromList(tenantId, coberturas);
        } catch (syncErr) {
            console.error("Coverage seed error:", syncErr);
        }

        const coverages = await findAllMedicalCoveragesWithPlans(tenantId);

        // Fallback: si la DB quedó vacía (seed falló o tablas aún no existen), devolver la
        // lista estática formateada para que el frontend siempre tenga coberturas disponibles.
        if (coverages.length === 0) {
            const staticList = coberturas
                .filter(c => c.title?.trim())
                .map((c, i) => ({
                    id: `static-${i}`,
                    tenantId,
                    name: c.title!.trim(),
                    plans: (c.plans || []).map((p, pi) => ({
                        id: `static-${i}-${pi}`,
                        tenantId,
                        coverageId: `static-${i}`,
                        name: p.name,
                    })),
                }));
            return NextResponse.json(staticList);
        }

        return NextResponse.json(coverages);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getSession();
    if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const body = await req.json();
        const { name, plans } = body;

        if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const formattedPlans = (plans || []).map((plan: any) => ({
            id: plan.id || randomUUID(),
            tenantId,
            name: typeof plan === 'string' ? plan : plan.name,
        }));

        const result = await createMedicalCoverage({
            id: randomUUID(),
            tenantId,
            name,
            plans: formattedPlans,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
