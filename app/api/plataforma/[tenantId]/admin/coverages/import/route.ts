import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createMedicalCoverage, findAllMedicalCoveragesWithPlans } from "@/lib/db";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getSession();
    if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        // Read the JSON file
        const filePath = join(process.cwd(), "docs", "coberturas.json");
        const fileContents = readFileSync(filePath, "utf-8");
        const coveragesData = JSON.parse(fileContents);

        // Get existing coverages to avoid duplicates
        const existingCoverages = await findAllMedicalCoveragesWithPlans(tenantId);
        const existingCoverageNames = new Set(existingCoverages.map(c => c.name.toLowerCase().trim()));

        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const coverageItem of coveragesData) {
            const coverageName = coverageItem.title?.trim();
            
            if (!coverageName) {
                errors.push("Cobertura sin título encontrada");
                continue;
            }

            // Skip if already exists
            if (existingCoverageNames.has(coverageName.toLowerCase())) {
                skipped++;
                continue;
            }

            try {
                const coverageId = randomUUID();
                const plans = (coverageItem.plans || []).map((plan: any) => ({
                    id: randomUUID(),
                    name: typeof plan === 'string' ? plan : (plan.name || plan).trim()
                })).filter((p: any) => p.name); // Filter out empty plan names

                await createMedicalCoverage({
                    id: coverageId,
                    tenantId,
                    name: coverageName,
                    plans: plans
                });

                imported++;
            } catch (error: any) {
                errors.push(`Error al importar "${coverageName}": ${error.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            skipped,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
