
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppReminder } from "@/lib/whatsapp";
import { toZonedTime } from "date-fns-tz";
import { User, Appointment, Location, Specialty, ProfessionalProfile } from "@prisma/client";

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

    // Define a 1-hour window around the target time to catch all appointments for this hour
    // We use UTC components because our database stores dates as "naive" local time
    // but Prisma/mysql2 interprets them as UTC.
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
        targetTime.getUTCHours() + 1, // Window of 1 hour
        0,
        0
    ));

    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                status: "CONFIRMED", // Only remind confirmed appointments
                startAt: {
                    gte: queryStart,
                    lt: queryEnd,
                },
            },
            include: {
                patient: true,
                professional: true,
                location: true,
            },
        });

        console.log(`[Cron:Reminders] Found ${appointments.length} appointments between ${queryStart.toISOString()} and ${queryEnd.toISOString()}`);

        let sentCount = 0;
        const errors: any[] = [];

        for (const appointment of appointments) {
            const { patient } = appointment;

            if (!patient.phoneNumber) {
                console.warn(`[Cron:Reminders] user ${patient.id} has no phone number.`);
                continue;
            }

            // Convert phone number to WhatsApp format ensuring it has country code
            // Assuming Argentina (+54), remove 0 and 15 if present, ensuring 549 prefix
            // Logic: If starts with 549, good. If starts with 11, add 549.
            // This logic depends heavily on how phone numbers are stored.
            // For now, we assume stored number is clean enough or needs basic prefixing.

            let phone = patient.phoneNumber.replace(/\D/g, ""); // remove non-digits
            if (!phone.startsWith("549") && phone.length === 10) {
                // e.g. 11 1234 5678 -> 549 11 1234 5678
                phone = `549${phone}`;
            } else if (!phone.startsWith("54")) {
                // If just local number without 54 or 9, assuming Argentina mobile
                phone = `549${phone}`;
            }

            // Send the message
            const sent = await sendWhatsAppReminder(
                appointment,
                phone
            );

            if (sent) {
                sentCount++;
            } else {
                errors.push({ appointmentId: appointment.id, error: "Failed to send WhatsApp" });
            }
        }

        return NextResponse.json({
            success: true,
            processed: appointments.length,
            sent: sentCount,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("[Cron:Reminders] Error processing reminders:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
