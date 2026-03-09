import { NextResponse } from "next/server";
import { findAllTenants } from "@/lib/db";
import { findAppointmentsByDateRange } from "@/lib/db";
import { sendWhatsAppReminder } from "@/lib/whatsapp";
import {
  getTenantFeatures,
  getTenantWhatsAppReminderOption,
  incrementWhatsAppUsage,
} from "@/lib/tenant-features";
import type { WhatsappReminderOption } from "@/lib/tenant-features";
import type { ReminderAppointmentData } from "@/lib/whatsapp";
import { AppointmentStatus } from "@/lib/types";

const CRON_SECRET = process.env.CRON_SECRET;

/** Build 24h window: startAt in [now+23h, now+25h] (UTC). */
function get24hWindow(): { start: Date; end: Date } {
  const now = Date.now();
  return {
    start: new Date(now + 23 * 60 * 60 * 1000),
    end: new Date(now + 25 * 60 * 60 * 1000),
  };
}

/** Build 48h window: startAt in [now+47h, now+49h] (UTC). */
function get48hWindow(): { start: Date; end: Date } {
  const now = Date.now();
  return {
    start: new Date(now + 47 * 60 * 60 * 1000),
    end: new Date(now + 49 * 60 * 60 * 1000),
  };
}

function shouldSendIn24h(option: WhatsappReminderOption): boolean {
  return option === "24" || option === "48_and_24";
}

function shouldSendIn48h(option: WhatsappReminderOption): boolean {
  return option === "48" || option === "48_and_24";
}

function formatPhone(phone: string | null | undefined): string | null {
  if (!phone || typeof phone !== "string") return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits.startsWith("549") && !digits.startsWith("54")) {
    digits = `549${digits}`;
  } else if (digits.startsWith("54") && !digits.startsWith("549") && digits.length === 12) {
    digits = `549${digits.substring(2)}`;
  }
  return digits;
}

function toReminderData(
  apt: Awaited<ReturnType<typeof findAppointmentsByDateRange>>[number]
): ReminderAppointmentData {
  return {
    startAt: apt.startAt,
    patient: { name: apt.patient.name ?? "Cliente", phone: apt.patient.phone ?? undefined },
    professional: { name: apt.professional.name ?? "el profesional" },
    location: { name: apt.location.name ?? "—" },
    serviceName: null,
  };
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV !== "development" && authHeader !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const window24 = get24hWindow();
  const window48 = get48hWindow();

  try {
    const tenants = await findAllTenants();
    let sentCount = 0;
    let quotaSkippedCount = 0;
    let featureDisabledCount = 0;
    const errors: { appointmentId: string; error: string }[] = [];
    const tenantFeaturesCache: Record<string, Awaited<ReturnType<typeof getTenantFeatures>>> = {};

    for (const tenant of tenants) {
      const tenantId = tenant.id;
      const option = await getTenantWhatsAppReminderOption(tenantId);

      if (!tenantFeaturesCache[tenantId]) {
        tenantFeaturesCache[tenantId] = await getTenantFeatures(tenantId);
      }
      const features = tenantFeaturesCache[tenantId];
      if (!features.whatsappNotifications) {
        continue;
      }

      const customMessage =
        typeof features.whatsappCustomMessage === "string" && features.whatsappCustomMessage.trim()
          ? features.whatsappCustomMessage.trim()
          : undefined;

      const appointments24 = shouldSendIn24h(option)
        ? await findAppointmentsByDateRange(tenantId, window24.start, window24.end, {
            status: AppointmentStatus.CONFIRMED,
          })
        : [];
      const appointments48 = shouldSendIn48h(option)
        ? await findAppointmentsByDateRange(tenantId, window48.start, window48.end, {
            status: AppointmentStatus.CONFIRMED,
          })
        : [];

      const seen = new Set<string>();
      const toSend = [...appointments24, ...appointments48].filter((a) => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });

      for (const appointment of toSend) {
        const phone = formatPhone(appointment.patient.phone);
        if (!phone) {
          console.warn(`[Cron:Reminders] Patient ${appointment.patient.id} has no phone.`);
          continue;
        }

        const hasQuota = await incrementWhatsAppUsage(tenantId);
        if (!hasQuota) {
          quotaSkippedCount++;
          continue;
        }

        const data = toReminderData(appointment);
        const sent = await sendWhatsAppReminder(data, phone, customMessage);
        if (sent) {
          sentCount++;
        } else {
          errors.push({ appointmentId: appointment.id, error: "Failed to send WhatsApp" });
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      quotaSkipped: quotaSkippedCount,
      featureDisabled: featureDisabledCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[Cron:Reminders] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
