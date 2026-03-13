import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createMedicalCoverage, findAllMedicalCoveragesWithPlans } from "@/lib/db";
import { randomUUID } from "crypto";
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

        const existingCoverages = await findAllMedicalCoveragesWithPlans(tenantId);
        const existingCoverageNames = new Set(existingCoverages.map(c => c.name.toLowerCase().trim()));

        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const coverageItem of coberturas) {
            const coverageName = coverageItem.title?.trim();

            if (!coverageName) {
                errors.push("Cobertura sin título encontrada");
                continue;
            }

            if (existingCoverageNames.has(coverageName.toLowerCase())) {
                skipped++;
                continue;
            }

            try {
                const plans = (coverageItem.plans || []).map((plan: any) => ({
                    id: randomUUID(),
                    name: typeof plan === "string" ? plan : (plan.name || plan).trim(),
                })).filter((p: any) => p.name);

                await createMedicalCoverage({
                    id: randomUUID(),
                    tenantId,
                    name: coverageName,
                    plans,
                });
                imported++;
            } catch (error: any) {
                errors.push(`Error al importar "${coverageName}": ${(error as Error).message}`);
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            skipped,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
