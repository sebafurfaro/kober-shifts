/**
 * Helpers to get professional available days for use in date pickers (isDateUnavailable).
 * Supports both legacy (availableDays + availableHours) and new (availabilityConfig.days) systems.
 */

export interface ProfessionalHoliday {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  description?: string;
}

/** Professional shape from API: may have availabilityConfig.days (keys = day 0-6) or legacy availableDays */
export interface ProfessionalAvailabilitySource {
  availableDays?: number[] | null;
  availabilityConfig?: {
    days?: Record<string | number, { slots?: unknown[] }>;
    holidays?: ProfessionalHoliday[];
  } | null;
  holidays?: ProfessionalHoliday[];
}

/**
 * Returns true if the given date falls within any of the professional's holiday periods.
 */
export function isDateInHoliday(
  date: { year: number; month: number; day: number },
  holidays: ProfessionalHoliday[]
): boolean {
  if (!holidays.length) return false;
  const dateStr = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
  return holidays.some((h) => dateStr >= h.startDate && dateStr <= h.endDate);
}

/**
 * Returns the holiday that contains the given date, or undefined.
 */
export function findHolidayForDate(
  date: { year: number; month: number; day: number },
  holidays: ProfessionalHoliday[]
): ProfessionalHoliday | undefined {
  if (!holidays.length) return undefined;
  const dateStr = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
  return holidays.find((h) => dateStr >= h.startDate && dateStr <= h.endDate);
}

/**
 * Returns day-of-week numbers (0 = Sunday, 1 = Monday, ..., 6 = Saturday) when the professional has availability.
 * Used to disable dates in date pickers when the professional does not work that day.
 */
export function getProfessionalAvailableDayNumbers(
  professional: ProfessionalAvailabilitySource | null | undefined
): number[] {
  if (!professional) return [];

  // New system: availabilityConfig.days with slots
  const daysConfig = professional.availabilityConfig?.days;
  if (daysConfig && typeof daysConfig === "object") {
    const days: number[] = [];
    for (const key of Object.keys(daysConfig)) {
      const num = Number(key);
      if (!Number.isNaN(num) && num >= 0 && num <= 6) {
        const dayConfig = daysConfig[key as keyof typeof daysConfig];
        const slots = dayConfig?.slots;
        if (Array.isArray(slots) && slots.length > 0) {
          days.push(num);
        }
      }
    }
    if (days.length > 0) return days;
  }

  // Legacy: availableDays array
  const legacy = professional.availableDays;
  if (Array.isArray(legacy) && legacy.length > 0) {
    return legacy.filter((d) => typeof d === "number" && d >= 0 && d <= 6);
  }

  return [];
}

/**
 * Day of week from @internationalized/date DateValue (CalendarDate / CalendarDateTime).
 * Uses same convention as JS Date.getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 */
export function getDayOfWeekFromDateValue(
  date: { year: number; month: number; day: number }
): number {
  return new Date(date.year, date.month - 1, date.day).getDay();
}

/**
 * Returns an isDateUnavailable function for HeroUI DatePicker/Calendar so that
 * only days when the professional has availability are selectable, and holiday
 * periods are also blocked.
 */
export function createIsDateUnavailableForProfessional(
  availableDayNumbers: number[],
  holidays: ProfessionalHoliday[] = []
): ((date: { year: number; month: number; day: number }) => boolean) | undefined {
  if (availableDayNumbers.length === 0 && holidays.length === 0) return undefined;
  return (date) => {
    if (isDateInHoliday(date, holidays)) return true;
    if (availableDayNumbers.length === 0) return false;
    const day = getDayOfWeekFromDateValue(date);
    return !availableDayNumbers.includes(day);
  };
}
