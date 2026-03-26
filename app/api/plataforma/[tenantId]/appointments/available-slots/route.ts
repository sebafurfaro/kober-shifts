import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  findProfessionalProfileByUserId,
  findAppointmentsByDateRange,
  findGoogleOAuthTokenByUserId,
  findServiceById,
} from "@/lib/db";
import { getTenantSettingsRow } from "@/lib/settings-db";
import { getCalendarClient } from "@/lib/googleOAuth";
import { AppointmentStatus } from "@/lib/types";
import { normalizeBlockedCalendarDays, normalizeHolidayAgendaAllowDays } from "@/lib/blocked-calendar-days";
import { fetchArgentinaNationalHolidayYmdsForYear } from "@/lib/argentina-national-holidays";
import { BUENOS_AIRES_TIMEZONE } from "@/lib/timezone";
import { formatInTimeZone } from "date-fns-tz";
import { ensureBookingCatalogAccess } from "@/lib/patient-self-booking";

/**
 * GET /api/plataforma/[tenantId]/appointments/available-slots?professionalId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Calculate available appointment slots for a professional based on:
 * - availabilityConfig (new system with slots)
 * - availableDays/availableHours (legacy system)
 * - Existing appointments
 * - Google Calendar events
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const session = await getSession();
    const gate = await ensureBookingCatalogAccess(session, tenantId);
    if (gate) return gate;

    const url = new URL(req.url);
    const professionalId = url.searchParams.get("professionalId");
    const serviceId = url.searchParams.get("serviceId");
    const startDateStr = url.searchParams.get("startDate");
    const endDateStr = url.searchParams.get("endDate");

    if (!professionalId) {
      return NextResponse.json(
        { error: "professionalId is required" },
        { status: 400 }
      );
    }

  // Default to next 30 days if dates not provided
  // Parse dates as local dates to avoid timezone issues
  const now = new Date();
  const startDate = startDateStr
    ? (() => {
        const [year, month, day] = startDateStr.split('-').map(Number);
        return new Date(year, month - 1, day, 0, 0, 0, 0);
      })()
    : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = endDateStr
    ? (() => {
        const [year, month, day] = endDateStr.split('-').map(Number);
        return new Date(year, month - 1, day, 23, 59, 59, 999);
      })()
    : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);

  const profile = await findProfessionalProfileByUserId(professionalId, tenantId);
  if (!profile || !profile.isActive) {
    return NextResponse.json(
      { error: "Professional not found or inactive" },
      { status: 404 }
    );
  }

  // Resolve slot duration and margin: service overrides tenant defaults
  const settingsRow = await getTenantSettingsRow(tenantId).catch(() => null);
  const settings =
    settingsRow?.settings && typeof settingsRow.settings === "object"
      ? (settingsRow.settings as Record<string, unknown>)
      : {};
  let appointmentDurationMinutes =
    typeof settings.defaultSlotDurationMinutes === "number" && settings.defaultSlotDurationMinutes > 0
      ? settings.defaultSlotDurationMinutes
      : 30;
  let slotMarginMinutes =
    typeof settings.defaultSlotMarginMinutes === "number" && settings.defaultSlotMarginMinutes >= 0
      ? settings.defaultSlotMarginMinutes
      : 0;
  const blockAgendaOnNationalHolidays = settings.blockAgendaOnNationalHolidays === true;
  const manualBlockedSet = new Set(normalizeBlockedCalendarDays(settings.blockedCalendarDays));
  const holidayAllowSet = new Set(normalizeHolidayAgendaAllowDays(settings.holidayAgendaAllowDays));
  const y1 = startDate.getFullYear();
  const y2 = endDate.getFullYear();
  const nationalHolidayYmds = new Set<string>();
  for (let y = y1; y <= y2; y++) {
    const s = await fetchArgentinaNationalHolidayYmdsForYear(y);
    for (const d of s) nationalHolidayYmds.add(d);
  }
  const isTenantDayBlocked = (ymd: string): boolean => {
    if (manualBlockedSet.has(ymd)) return true;
    if (!blockAgendaOnNationalHolidays) return false;
    if (holidayAllowSet.has(ymd)) return false;
    return nationalHolidayYmds.has(ymd);
  };
  if (serviceId) {
    const service = await findServiceById(serviceId, tenantId);
    if (service) {
      if (service.durationMinutes > 0) appointmentDurationMinutes = service.durationMinutes;
      if (service.marginMinutes >= 0) slotMarginMinutes = service.marginMinutes;
    }
  }

  // Get existing appointments (both REQUESTED and CONFIRMED are considered occupied)
  // We need to get all non-cancelled appointments to exclude them from available slots
  const allAppointments = await findAppointmentsByDateRange(
    tenantId,
    startDate,
    endDate,
    { professionalId }
  );
  // Filter out cancelled appointments - only REQUESTED and CONFIRMED are considered occupied
  const existingAppointments = allAppointments.filter(
    (apt) => apt.status !== AppointmentStatus.CANCELLED
  );

  // Get Google Calendar events if OAuth is connected
  let googleEvents: Array<{ start: Date; end: Date }> = [];
  try {
    const googleOAuth = await findGoogleOAuthTokenByUserId(
      professionalId,
      tenantId
    );
    if (googleOAuth && profile.googleCalendarId) {
      const calendar = await getCalendarClient(
        googleOAuth.accessToken,
        googleOAuth.refreshToken
      );
      const calendarId = profile.googleCalendarId || "primary";
      const res = await calendar.events.list({
        calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      googleEvents =
        res.data.items?.map((event) => {
          const start = event.start?.dateTime
            ? new Date(event.start.dateTime)
            : event.start?.date
            ? new Date(event.start.date)
            : new Date();
          const end = event.end?.dateTime
            ? new Date(event.end.dateTime)
            : event.end?.date
            ? new Date(event.end.date)
            : new Date();
          return { start, end };
        }) || [];
    }
  } catch (error) {
    console.error("Error fetching Google Calendar events:", error);
    // Continue without Google Calendar events
  }

  // Debug: Log profile availability configuration
  // Normalize days keys for logging
  const normalizedDaysForLog: { [key: number]: any } = {};
  if (profile.availabilityConfig?.days) {
    for (const key in profile.availabilityConfig.days) {
      const numKey = Number(key);
      if (!isNaN(numKey)) {
        normalizedDaysForLog[numKey] = profile.availabilityConfig.days[key];
      }
    }
  }
  
  // Log detailed information about availability
  const daysWithSlots = Object.keys(normalizedDaysForLog).filter(dayKey => {
    const dayConfig = normalizedDaysForLog[Number(dayKey)];
    return dayConfig?.slots && Array.isArray(dayConfig.slots) && dayConfig.slots.length > 0;
  }).map(Number);
  
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  console.log("Professional availability check:", {
    professionalId,
    hasAvailabilityConfig: Object.keys(normalizedDaysForLog).length > 0,
    availabilityConfigDays: Object.keys(normalizedDaysForLog).map(Number),
    availabilityConfigDaysNames: Object.keys(normalizedDaysForLog).map(dayKey => dayNames[Number(dayKey)]),
    availabilityConfigDaysWithSlots: daysWithSlots,
    availabilityConfigDaysWithSlotsNames: daysWithSlots.map(day => dayNames[day]),
    rawAvailabilityConfigDays: profile.availabilityConfig?.days ? Object.keys(profile.availabilityConfig.days) : null,
    rawAvailabilityConfigDaysTypes: profile.availabilityConfig?.days ? Object.keys(profile.availabilityConfig.days).map(k => typeof k) : null,
    availableDays: profile.availableDays,
    availableDaysType: typeof profile.availableDays,
    availableDaysIsArray: Array.isArray(profile.availableDays),
    availableDaysLength: Array.isArray(profile.availableDays) ? profile.availableDays.length : null,
    availableHours: profile.availableHours,
    availableHoursType: typeof profile.availableHours,
    rawAvailabilityConfig: JSON.stringify(profile.availabilityConfig),
  });

  // Generate available slots (now = hora actual: para hoy no se muestran slots previos a esta hora)
  const slots = generateAvailableSlots(
    profile,
    startDate,
    endDate,
    existingAppointments,
    googleEvents,
    now,
    appointmentDurationMinutes,
    slotMarginMinutes,
    isTenantDayBlocked
  );

  console.log("Generated slots count:", slots.length);

    return NextResponse.json(slots);
  } catch (error: any) {
    console.error("Error in available-slots endpoint:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate available appointment slots based on professional availability
 */
/**
 * Check if a date falls within any holiday period
 */
function isDateInHoliday(date: Date, holidays: Array<{ startDate: string; endDate: string }> | null | undefined): boolean {
  if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
    return false;
  }

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  for (const holiday of holidays) {
    const startDate = new Date(holiday.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(holiday.endDate);
    endDate.setHours(23, 59, 59, 999);

    if (dateOnly >= startDate && dateOnly <= endDate) {
      return true;
    }
  }

  return false;
}

/** True si la fecha del slot es el mismo día (local) que now. */
function isSameCalendarDay(slotTime: Date, now: Date): boolean {
  return (
    slotTime.getFullYear() === now.getFullYear() &&
    slotTime.getMonth() === now.getMonth() &&
    slotTime.getDate() === now.getDate()
  );
}

function generateAvailableSlots(
  profile: any,
  startDate: Date,
  endDate: Date,
  existingAppointments: any[],
  googleEvents: Array<{ start: Date; end: Date }>,
  now: Date,
  appointmentDurationMinutes: number,
  slotMarginMinutes: number,
  isTenantDayBlocked: (ymd: string) => boolean
): Array<{ date: string; time: string; datetime: string }> {
  const slots: Array<{ date: string; time: string; datetime: string }> = [];
  const appointmentDuration = Math.max(1, appointmentDurationMinutes);
  const slotStepMinutes = appointmentDuration + Math.max(0, slotMarginMinutes); // siguiente slot empieza después de duración + margen
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Get holidays from availabilityConfig
  const holidays = profile.availabilityConfig?.holidays || [];

  // Combine all busy times
  const busyTimes: Array<{ start: Date; end: Date }> = [
    ...existingAppointments.map((apt) => ({
      start: apt.startAt instanceof Date ? apt.startAt : new Date(apt.startAt),
      end: apt.endAt instanceof Date ? apt.endAt : new Date(apt.endAt),
    })),
    ...googleEvents,
  ];

  // Check if professional has any availability configured
  // For new system: check if availabilityConfig has at least one day with slots
  // Normalize keys to numbers first (JSON parsing may convert them to strings)
  const normalizedDaysForCheck: { [key: number]: any } = {};
  if (profile.availabilityConfig?.days) {
    for (const key in profile.availabilityConfig.days) {
      const numKey = Number(key);
      if (!isNaN(numKey)) {
        normalizedDaysForCheck[numKey] = profile.availabilityConfig.days[key];
      }
    }
  }
  
  const hasAvailabilityConfig = Object.keys(normalizedDaysForCheck).length > 0 && 
    Object.keys(normalizedDaysForCheck).some(
      (dayKey) => {
        const dayConfig = normalizedDaysForCheck[Number(dayKey)];
        return dayConfig?.slots && Array.isArray(dayConfig.slots) && dayConfig.slots.length > 0;
      }
    );
  
  // For legacy system: check if availableDays is a non-empty array and availableHours has valid values
  // Also verify that the hours are valid time strings (HH:mm format)
  const hasLegacyAvailability = profile.availableDays && 
    Array.isArray(profile.availableDays) && 
    profile.availableDays.length > 0 && 
    profile.availableHours && 
    typeof profile.availableHours === 'object' &&
    profile.availableHours.start && 
    typeof profile.availableHours.start === 'string' &&
    profile.availableHours.start.trim() !== '' &&
    /^\d{2}:\d{2}$/.test(profile.availableHours.start.trim()) &&
    profile.availableHours.end &&
    typeof profile.availableHours.end === 'string' &&
    profile.availableHours.end.trim() !== '' &&
    /^\d{2}:\d{2}$/.test(profile.availableHours.end.trim());

  console.log("Availability validation:", {
    hasAvailabilityConfig,
    hasLegacyAvailability,
    availableDays: profile.availableDays,
    availableHours: profile.availableHours,
  });

  // If no availability is configured at all, return empty array immediately
  if (!hasAvailabilityConfig && !hasLegacyAvailability) {
    console.log("No availability configured, returning empty array");
    return [];
  }

  // Normalize legacy availableDays to a Set of numbers (0-6) so we only allow those days.
  // If both systems exist, we intersect: availabilityConfig is restricted to these days.
  let legacyAllowedDays: Set<number> | null = null;
  if (profile.availableDays && Array.isArray(profile.availableDays) && profile.availableDays.length > 0) {
    const nums = profile.availableDays
      .map((d: unknown) => (typeof d === "number" ? d : Number(d)))
      .filter((n: number) => !Number.isNaN(n) && n >= 0 && n <= 6);
    if (nums.length > 0) legacyAllowedDays = new Set(nums);
  }

  // Use new availabilityConfig if available, otherwise fall back to legacy
  if (hasAvailabilityConfig && profile.availabilityConfig?.days) {
    // New system: availabilityConfig with slots
    // If legacy availableDays is set, only generate slots for those days (intersect).
    const normalizedDays = normalizedDaysForCheck;
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Skip if date is in a holiday period
      if (isDateInHoliday(currentDate, holidays)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const blockedYmd = formatInTimeZone(currentDate, BUENOS_AIRES_TIMEZONE, "yyyy-MM-dd");
      if (isTenantDayBlocked(blockedYmd)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      if (legacyAllowedDays !== null && !legacyAllowedDays.has(dayOfWeek)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      const dayConfig = normalizedDays[dayOfWeek];
      
      // Format date in local timezone for logging
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      console.log(`Checking ${formatLocalDate(currentDate)} (${dayNames[dayOfWeek]}, dayOfWeek=${dayOfWeek}):`, {
        hasDayConfig: !!dayConfig,
        slotsCount: dayConfig?.slots?.length || 0,
        normalizedDaysKeys: Object.keys(normalizedDays).map(Number),
      });

      if (dayConfig?.slots && dayConfig.slots.length > 0) {
        for (const slot of dayConfig.slots) {
          // Check if slot is valid for this date
          // Parse fromDate as local date (YYYY-MM-DD format) to avoid timezone issues
          const [fromYear, fromMonth, fromDay] = slot.fromDate.split('-').map(Number);
          const slotFromDate = new Date(fromYear, fromMonth - 1, fromDay);
          slotFromDate.setHours(0, 0, 0, 0);
          
          const slotToDate = slot.toDate
            ? (() => {
                const [toYear, toMonth, toDay] = slot.toDate.split('-').map(Number);
                const date = new Date(toYear, toMonth - 1, toDay);
                date.setHours(23, 59, 59, 999);
                return date;
              })()
            : null;

          const currentDateOnly = new Date(currentDate);
          currentDateOnly.setHours(0, 0, 0, 0);

          // Check if slot applies to this date
          let slotApplies = false;
          
          // First check if date is within the slot's date range
          const inDateRange = currentDateOnly >= slotFromDate && (!slotToDate || currentDateOnly <= slotToDate);
          
          if (!inDateRange) {
            // Date is outside the slot's range, skip
            slotApplies = false;
          } else {
            // Date is within range, check repeat pattern.
            // We're already in dayConfig[dayOfWeek], so currentDate is the right weekday.
            const daysDiff = Math.floor(
              (currentDateOnly.getTime() - slotFromDate.getTime()) /
                (24 * 60 * 60 * 1000)
            );
            
            if (slot.repeat === "weekly") {
              // Weekly: this slot (for this weekday) applies every week in range. We already
              // filtered by day of week via dayConfig[dayOfWeek], so any date in range applies.
              slotApplies = true;
            } else if (slot.repeat === "biweekly") {
              // Biweekly: slot applies every 2 weeks (daysDiff multiple of 14)
              slotApplies = daysDiff >= 0 && daysDiff % 14 === 0;
            } else if (slot.repeat === "monthly") {
              // Monthly: same day number each month
              slotApplies = currentDateOnly.getDate() === slotFromDate.getDate();
            } else {
              // No repeat or unknown: only on the exact fromDate
              slotApplies = daysDiff === 0;
            }
          }
          
          const daysDiffForLog = inDateRange 
            ? Math.floor((currentDateOnly.getTime() - slotFromDate.getTime()) / (24 * 60 * 60 * 1000))
            : null;
          
          // Format dates for logging (avoid timezone issues)
          const formatDateForLog = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };
          
          console.log(`Slot validation for ${formatDateForLog(currentDate)} (${dayNames[dayOfWeek]}):`, {
            slotId: slot.id,
            slotFromDateRaw: slot.fromDate,
            slotFromDateParsed: formatDateForLog(slotFromDate),
            slotToDate: slotToDate ? formatDateForLog(slotToDate) : null,
            currentDateOnly: formatDateForLog(currentDateOnly),
            repeat: slot.repeat,
            slotApplies,
            inDateRange,
            daysDiff: daysDiffForLog,
            willGenerateSlots: slotApplies,
          });

          if (slotApplies) {
            // Generate slots within this time range
            const [startHour, startMin] = slot.startTime.split(":").map(Number);
            const [endHour, endMin] = slot.endTime.split(":").map(Number);

            let slotTime = new Date(currentDate);
            slotTime.setHours(startHour, startMin, 0, 0);

            const endTime = new Date(currentDate);
            endTime.setHours(endHour, endMin, 0, 0);

            let slotsGeneratedForThisDate = 0;
            while (slotTime < endTime) {
              const slotEnd = new Date(
                slotTime.getTime() + appointmentDuration * 60 * 1000
              );

              // Check if this slot conflicts with busy times
              const isBusy = busyTimes.some((busy) => {
                return (
                  (slotTime >= busy.start && slotTime < busy.end) ||
                  (slotEnd > busy.start && slotEnd <= busy.end) ||
                  (slotTime <= busy.start && slotEnd >= busy.end)
                );
              });

              // Para la fecha actual no mostrar slots que empiecen antes de la hora de ingreso
              const isToday = isSameCalendarDay(slotTime, now);
              const slotAlreadyPassed = isToday && slotTime.getTime() < now.getTime();

              if (!isBusy && slotEnd <= endTime && !slotAlreadyPassed) {
                // Format date in local timezone to avoid day shift
                // Use currentDate directly (it's already in local timezone from the loop)
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                const timeStr = `${String(slotTime.getHours()).padStart(2, "0")}:${String(slotTime.getMinutes()).padStart(2, "0")}`;
                
                // Create datetime string in ISO format but using local time
                const datetimeStr = `${dateStr}T${timeStr}:00`;
                
                // Verify the date matches the day of week we're processing
                const slotDayOfWeek = currentDate.getDay();
                if (slotDayOfWeek !== dayOfWeek) {
                  console.warn(`WARNING: Date mismatch! Processing ${dayNames[dayOfWeek]} but slot date is ${dayNames[slotDayOfWeek]}`, {
                    dateStr,
                    expectedDay: dayNames[dayOfWeek],
                    actualDay: dayNames[slotDayOfWeek],
                  });
                }
                
                slots.push({
                  date: dateStr,
                  time: timeStr,
                  datetime: datetimeStr,
                });
                slotsGeneratedForThisDate++;
              }

              slotTime = new Date(slotTime.getTime() + slotStepMinutes * 60 * 1000);
            }
            
            const formatLocalDate = (date: Date) => {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            };
            console.log(`Generated ${slotsGeneratedForThisDate} slots for ${formatLocalDate(currentDate)} (${dayNames[dayOfWeek]}) from slot ${slot.id}`);
          }
        }
      }
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else if (hasLegacyAvailability && legacyAllowedDays && legacyAllowedDays.size > 0 && profile.availableHours) {
    // Legacy system: availableDays and availableHours (use normalized legacyAllowedDays)
    if (!profile.availableHours?.start || !profile.availableHours?.end) {
      console.log("Invalid availableHours, returning empty array");
      return [];
    }
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Skip if date is in a holiday period
      if (isDateInHoliday(currentDate, holidays)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const blockedYmdLegacy = formatInTimeZone(currentDate, BUENOS_AIRES_TIMEZONE, "yyyy-MM-dd");
      if (isTenantDayBlocked(blockedYmdLegacy)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const dayOfWeek = currentDate.getDay();
      if (legacyAllowedDays.has(dayOfWeek)) {
        const [startHour, startMin] = profile.availableHours.start
          .split(":")
          .map(Number);
        const [endHour, endMin] = profile.availableHours.end
          .split(":")
          .map(Number);

        let slotTime = new Date(currentDate);
        slotTime.setHours(startHour, startMin, 0, 0);

        const endTime = new Date(currentDate);
        endTime.setHours(endHour, endMin, 0, 0);

        while (slotTime < endTime) {
          const slotEnd = new Date(
            slotTime.getTime() + appointmentDuration * 60 * 1000
          );

          // Check if this slot conflicts with busy times
          const isBusy = busyTimes.some((busy) => {
            return (
              (slotTime >= busy.start && slotTime < busy.end) ||
              (slotEnd > busy.start && slotEnd <= busy.end) ||
              (slotTime <= busy.start && slotEnd >= busy.end)
            );
          });

          // Para la fecha actual no mostrar slots que empiecen antes de la hora de ingreso
          const isTodayLegacy = isSameCalendarDay(slotTime, now);
          const slotAlreadyPassedLegacy = isTodayLegacy && slotTime.getTime() < now.getTime();

          if (!isBusy && slotEnd <= endTime && !slotAlreadyPassedLegacy) {
            const dateStr = currentDate.toISOString().split("T")[0];
            const timeStr = `${String(slotTime.getHours()).padStart(2, "0")}:${String(slotTime.getMinutes()).padStart(2, "0")}`;
            slots.push({
              date: dateStr,
              time: timeStr,
              datetime: slotTime.toISOString(),
            });
          }

          slotTime = new Date(slotTime.getTime() + slotStepMinutes * 60 * 1000);
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // Sort slots by datetime
  slots.sort((a, b) => a.datetime.localeCompare(b.datetime));

  // Log first few slots to verify dates
  console.log("First 5 generated slots:", slots.slice(0, 5).map(s => ({
    date: s.date,
    time: s.time,
    datetime: s.datetime,
    dayOfWeek: (() => {
      const [year, month, day] = s.date.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return dayNames[date.getDay()];
    })(),
  })));

  return slots;
}
