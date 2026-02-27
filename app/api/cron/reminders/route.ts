import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppReminder } from "@/lib/whatsapp";
import { getTenantFeatures, incrementWhatsAppUsage } from "@/lib/tenant-features";
import { toZonedTime } from "date-fns-tz";

// Authenticate via cron secret
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
    // Check authorization header
    const authHeader = req.headers.get("authorization");
    if (process.env.NODE_ENV !== "development" && authHeader !== `Bearer ${CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Define target time: 24 hours from now in Buenos Aires timezone
    const BA_TIMEZONE = "America/Argentina/Buenos_Aires";
    const now = new Date();
    const nowInBA = toZonedTime(now, BA_TIMEZONE);

    // Target: tomorrow at this hour
    const targetTime = new Date(nowInBA);
    targetTime.setDate(targetTime.getDate() + 1);

    const queryStart = new Date(Date.UTC(
        targetTime.getFullYear(),
        targetTime.getMonth(),
        targetTime.getDate(),
        targetTime.getUTCHours(),
        0,
        0
    ));

    const queryEnd = new Date(Date.UTC(
        targetTime.getFullYear(),
        targetTime.getMonth(),
        targetTime.getDate(),
        targetTime.getUTCHours() + 1,
        0,
        0
    ));

    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                status: "CONFIRMED",
                startAt: {
                    gte: queryStart,
                    lt: queryEnd,
                },
            },
            include: {
                patient: true,
                professional: true,
                location: true,
                specialty: true,
            },
        });

        console.log(`[Cron:Reminders] Found ${appointments.length} appointments between ${queryStart.toISOString()} and ${queryEnd.toISOString()}`);

        let sentCount = 0;
        let quotaSkippedCount = 0;
        let featureDisabledCount = 0;
        const errors: any[] = [];

        // Cache for tenant features to avoid redundant DB calls
        const tenantFeaturesCache: Record<string, any> = {};

        for (const appointment of appointments) {
            const { tenantId, patient } = appointment;

            if (!patient.phoneNumber) {
                console.warn(`[Cron:Reminders] user ${patient.id} has no phone number.`);
                continue;
            }

            // Get tenant features (with cache)
            if (!tenantFeaturesCache[tenantId]) {
                tenantFeaturesCache[tenantId] = await getTenantFeatures(tenantId);
            }
            const features = tenantFeaturesCache[tenantId];

            if (!features.whatsappNotifications) {
                featureDisabledCount++;
                continue;
            }

            // Check and increment quota
            const hasQuota = await incrementWhatsAppUsage(tenantId);
            if (!hasQuota) {
                quotaSkippedCount++;
                console.warn(`[Cron:Reminders] Tenant ${tenantId} skipped due to quota limit.`);
                continue;
            }

            // Format phone number
            let phone = patient.phoneNumber.replace(/\D/g, "");
            if (!phone.startsWith("549") && !phone.startsWith("54")) {
                phone = `549${phone}`;
            } else if (phone.startsWith("54") && !phone.startsWith("549") && phone.length === 12) {
                // Typical case: 54 11 ... -> 54 9 11 ...
                phone = `549${phone.substring(2)}`;
            }

            // Send the message
            const sent = await sendWhatsAppReminder(
                appointment as any,
                phone
            );

            if (sent) {
                sentCount++;
            } else {
                errors.push({ appointmentId: appointment.id, error: "Failed to send WhatsApp" });
                // Note: We already decremented the quota. 
                // In a perfect world we might want to "refund" it, or just accept the loss 
                // if the failure was after the attempt.
            }
        }

        return NextResponse.json({
            success: true,
            processed: appointments.length,
            sent: sentCount,
            quotaSkipped: quotaSkippedCount,
            featureDisabled: featureDisabledCount,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("[Cron:Reminders] Error processing reminders:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

