import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAllMedicalCoveragesWithPlans, createMedicalCoverage } from "@/lib/db";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getSession();
    if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL" && session.role !== "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        // First, sync coverages from JSON file
        try {
            const filePath = join(process.cwd(), "docs", "coberturas.json");
            const fileContents = readFileSync(filePath, "utf-8");
            const coveragesData = JSON.parse(fileContents);

            // Get existing coverages to avoid duplicates
            const existingCoverages = await findAllMedicalCoveragesWithPlans(tenantId);
            const existingCoverageNames = new Set(existingCoverages.map(c => c.name.toLowerCase().trim()));

            // Import missing coverages from JSON
            for (const coverageItem of coveragesData) {
                const coverageName = coverageItem.title?.trim();
                
                if (!coverageName) {
                    continue;
                }

                // Skip if already exists
                if (existingCoverageNames.has(coverageName.toLowerCase())) {
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
                } catch (error: any) {
                    // Continue with other coverages if one fails
                    console.error(`Error importing coverage "${coverageName}":`, error);
                }
            }
        } catch (error: any) {
            // If JSON file doesn't exist or can't be read, continue with existing data
            console.error("Error syncing coverages from JSON:", error);
        }

        // Return all coverages (including newly synced ones)
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

        const coverageId = randomUUID();
        const formattedPlans = (plans || []).map((plan: any) => ({
            id: plan.id || randomUUID(),
            tenantId,
            name: typeof plan === 'string' ? plan : plan.name
        }));

        const result = await createMedicalCoverage({
            id: coverageId,
            tenantId,
            name,
            plans: formattedPlans
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
