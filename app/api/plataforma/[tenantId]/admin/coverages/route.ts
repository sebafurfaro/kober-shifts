import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAllMedicalCoveragesWithPlans, createMedicalCoverage } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getSession();
    if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL" && session.role !== "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        try {
            const response = await fetch(`${process.env.NEXTAUTH_URL}/docs/coberturas.json`);
            if (response.ok) {
                const coveragesData = await response.json();
                const existingCoverages = await findAllMedicalCoveragesWithPlans(tenantId);
                const existingCoverageNames = new Set(existingCoverages.map(c => c.name.toLowerCase().trim()));

                for (const coverageItem of coveragesData) {
                    const coverageName = coverageItem.title?.trim();
                    if (!coverageName || existingCoverageNames.has(coverageName.toLowerCase())) continue;

                    try {
                        const plans = (coverageItem.plans || []).map((plan: any) => ({
                            id: randomUUID(),
                            name: typeof plan === 'string' ? plan : (plan.name || plan).trim()
                        })).filter((p: any) => p.name);

                        await createMedicalCoverage({
                            id: randomUUID(),
                            tenantId,
                            name: coverageName,
                            plans,
                        });
                    } catch (error: any) {
                        console.error(`Error importing coverage "${coverageName}":`, error);
                    }
                }
            }
        } catch (error: any) {
            console.error("Error syncing coverages from JSON:", error);
        }

        const coverages = await findAllMedicalCoveragesWithPlans(tenantId);
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
            name: typeof plan === 'string' ? plan : plan.name
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