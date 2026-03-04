/**
 * Timezone utilities for handling Buenos Aires (GMT-3) timezone conversions
 * 
 * This module provides consistent timezone handling throughout the application.
 * All dates are stored in MySQL as "naive" local time (Buenos Aires) without timezone.
 * 
 * Key concepts:
 * - MySQL DATETIME stores dates without timezone (naive local time)
 * - mysql2 interprets DATETIME as UTC when reading
 * - We need to convert between "naive BA time" and "UTC Date objects" correctly
 */

import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

export const BUENOS_AIRES_TIMEZONE = "America/Argentina/Buenos_Aires";

/**
 * Converts a Date from MySQL (interpreted as UTC by mysql2) to a proper UTC Date
 * that represents the Buenos Aires local time.
 * 
 * Example: MySQL has "2026-01-09 09:00:00" (stored as BA local time)
 * - mysql2 reads it as "09:00 UTC"
 * - We need "12:00 UTC" (because 09:00 BA = 12:00 UTC)
 * 
 * @param mysqlDate - Date object from mysql2 (interpreted as UTC but actually BA local time)
 * @returns Date object in UTC representing the correct moment in time
 */
export function mysqlDateToUTC(mysqlDate: Date): Date {
  // mysql2 interprets the DATETIME as UTC, but it's actually BA local time
  // Extract the components that mysql2 thinks are UTC (but are actually BA time)
  const year = mysqlDate.getUTCFullYear();
  const month = mysqlDate.getUTCMonth();
  const day = mysqlDate.getUTCDate();
  const hours = mysqlDate.getUTCHours();
  const minutes = mysqlDate.getUTCMinutes();
  const seconds = mysqlDate.getUTCSeconds();
  
  // We have BA time components. We need to convert them to actual UTC.
  // 
  // Strategy: Use fromZonedTime which converts a date from a specific timezone to UTC.
  // The key is to create a Date that represents the BA time moment.
  //
  // fromZonedTime(date, timezone) treats the Date as if it represents
  // a moment in the specified timezone, then converts it to UTC.
  //
  // To use it correctly, we create a Date UTC with the BA components,
  // then use fromZonedTime to convert from BA timezone to UTC.
  // But wait - that's not how fromZonedTime works.
  //
  // Actually, fromZonedTime expects a Date that already represents the correct
  // moment when interpreted as the source timezone. So we need to create
  // a Date that, when fromZonedTime treats it as BA time, equals our target.
  //
  // The simplest approach: Create a Date UTC, check what BA time it represents,
  // and adjust iteratively until it matches.
  
  // Create initial Date UTC with BA components
  let utcDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  
  // Check what BA time this represents
  let baTime = toZonedTime(utcDate, BUENOS_AIRES_TIMEZONE);
  const targetBA = { year, month, day, hours, minutes, seconds };
  
  // Iteratively adjust until BA time matches target
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const currentBA = {
      year: baTime.getFullYear(),
      month: baTime.getMonth(),
      day: baTime.getDate(),
      hours: baTime.getHours(),
      minutes: baTime.getMinutes(),
      seconds: baTime.getSeconds(),
    };
    
    // Check if we match
    if (currentBA.year === targetBA.year &&
        currentBA.month === targetBA.month &&
        currentBA.day === targetBA.day &&
        currentBA.hours === targetBA.hours &&
        currentBA.minutes === targetBA.minutes) {
      return utcDate;
    }
    
    // Calculate adjustment needed
    // We need to adjust utcDate so that toZonedTime gives us targetBA
    const hourDiff = targetBA.hours - currentBA.hours;
    const minuteDiff = targetBA.minutes - currentBA.minutes;
    
    // If same day, adjust by hours and minutes
    if (currentBA.year === targetBA.year &&
        currentBA.month === targetBA.month &&
        currentBA.day === targetBA.day) {
      const adjustmentMs = hourDiff * 60 * 60 * 1000 + minuteDiff * 60 * 1000;
      utcDate = new Date(utcDate.getTime() + adjustmentMs);
    } else {
      // Different day - adjust by hours first
      const adjustmentMs = hourDiff * 60 * 60 * 1000;
      utcDate = new Date(utcDate.getTime() + adjustmentMs);
    }
    
    // Recalculate BA time
    baTime = toZonedTime(utcDate, BUENOS_AIRES_TIMEZONE);
    attempts++;
  }
  
  return utcDate;
}

/**
 * Converts a UTC Date to a Date that can be stored in MySQL as naive local time.
 * 
 * IMPORTANT: When called from the API, the Date always has BA time components
 * stored as UTC components (from fullCalendarDateToLocal). We extract these
 * components directly without conversion, because they already represent BA time.
 * 
 * Example: Client sends "16:00 UTC" (which represents 16:00 BA)
 * - We extract 16:00 directly
 * - MySQL stores "16:00:00" (BA time)
 * 
 * @param utcDate - Date object with BA time components stored as UTC components
 * @returns Date object that mysql2 will interpret correctly when storing
 */
export function utcToMySQLDate(utcDate: Date): Date {
  // The Date has BA time components stored as UTC components
  // Extract them directly without conversion
  const year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth();
  const day = utcDate.getUTCDate();
  const hours = utcDate.getUTCHours();
  const minutes = utcDate.getUTCMinutes();
  const seconds = utcDate.getUTCSeconds();
  
  // Create a Date with these BA components stored as UTC components
  // When mysql2 stores this, it will interpret the components as UTC
  // but we're actually storing BA local time, which is what we want
  return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
}

/**
 * Converts a real UTC Date (e.g. from patient booking with toISOString()) to a Date
 * that stores Buenos Aires local time for MySQL. Use this when the client sends
 * actual UTC (e.g. 17:00 UTC = 14:00 Argentina).
 *
 * @param utcDate - Real UTC Date (e.g. from new Date(isoString) where isoString has Z)
 * @returns Date with BA local components as UTC components for mysql2 storage
 */
export function realUTCToMySQLDate(utcDate: Date): Date {
  const baTime = toZonedTime(utcDate, BUENOS_AIRES_TIMEZONE);
  const year = baTime.getFullYear();
  const month = baTime.getMonth();
  const day = baTime.getDate();
  const hours = baTime.getHours();
  const minutes = baTime.getMinutes();
  const seconds = baTime.getSeconds();
  return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
}

/**
 * Converts a FullCalendar Date to a Date that represents the displayed BA time.
 * 
 * IMPORTANT: When FullCalendar has timeZone configured, the Date object returned
 * by dateClick has special behavior: getUTC* methods return the DISPLAYED time
 * in the configured timezone, not the actual UTC time.
 * 
 * @param fcDate - Date from FullCalendar (with timeZone configured, UTC methods return displayed time)
 * @returns Date object with BA time components stored as UTC components
 */
export function fullCalendarDateToLocal(fcDate: Date): Date {
  // When FullCalendar has timeZone configured, getUTC* methods return
  // the displayed time in that timezone, not actual UTC time
  // Example: User clicks 09:30 BA -> getUTCHours() returns 9 (the displayed BA hour)
  
  // Extract the displayed BA time components directly from UTC methods
  // No conversion needed - FullCalendar already gives us the displayed time
  const year = fcDate.getUTCFullYear();
  const month = fcDate.getUTCMonth();
  const day = fcDate.getUTCDate();
  const hours = fcDate.getUTCHours();
  const minutes = fcDate.getUTCMinutes();
  const seconds = fcDate.getUTCSeconds();
  
  // Create a Date UTC with these BA components stored as UTC components
  // This preserves the displayed BA time for later use in formatForDateTimeLocal
  return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
}

/**
 * Converts a Date with BA time components (stored as UTC components) to a UTC Date for FullCalendar.
 * 
 * Strategy: We create a Date UTC with BA components, then use toZonedTime to see
 * what BA time that represents. We then iteratively adjust the UTC Date until
 * toZonedTime gives us the desired BA time.
 * 
 * @param date - Date object with BA time components stored as UTC components
 * @returns Date object in UTC that FullCalendar will display correctly
 */
export function localDateToFullCalendar(date: Date): Date {
  // Extract BA time components (stored as UTC components)
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  
  // Create an initial UTC Date with BA components
  // This likely represents the wrong moment, but we'll adjust it
  let utcDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  
  // Check what BA time this UTC moment represents
  let baTime = toZonedTime(utcDate, BUENOS_AIRES_TIMEZONE);
  
  // Iteratively adjust until we get the correct BA time
  // This handles DST transitions and edge cases
  // IMPORTANT: We only use BA timezone, never the browser's timezone
  const targetBA = { year, month, day, hours, minutes, seconds };
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const currentBA = {
      year: baTime.getFullYear(),
      month: baTime.getMonth(),
      day: baTime.getDate(),
      hours: baTime.getHours(),
      minutes: baTime.getMinutes(),
      seconds: baTime.getSeconds(),
    };
    
    // Check if we match
    if (currentBA.year === targetBA.year &&
        currentBA.month === targetBA.month &&
        currentBA.day === targetBA.day &&
        currentBA.hours === targetBA.hours &&
        currentBA.minutes === targetBA.minutes) {
      break;
    }
    
    // Calculate adjustment needed
    // We need to find the UTC moment that represents targetBA in BA timezone
    // The best way is to use fromZonedTime, but we need a Date that represents BA time
    // without depending on browser timezone.
    // 
    // Strategy: Create a Date UTC with BA components, then use fromZonedTime
    // to convert it. But fromZonedTime expects a Date in local time that represents
    // the time in the specified timezone. So we need to create a Date that,
    // when interpreted as BA time, gives us the target BA time.
    //
    // Actually, we can use a simpler approach: calculate the difference between
    // current and target BA time, then adjust the UTC Date accordingly.
    // We'll use the fact that we can create Date objects in UTC and compare them
    // after converting to BA timezone.
    
    // Calculate difference in hours first (most common case)
    const hourDiff = targetBA.hours - currentBA.hours;
    
    // If dates match, just adjust by hours
    if (currentBA.year === targetBA.year &&
        currentBA.month === targetBA.month &&
        currentBA.day === targetBA.day) {
      // Same day, just adjust by hours and minutes
      const minuteDiff = targetBA.minutes - currentBA.minutes;
      const adjustmentMs = hourDiff * 60 * 60 * 1000 + minuteDiff * 60 * 1000;
      utcDate = new Date(utcDate.getTime() + adjustmentMs);
    } else {
      // Different day/month/year - need more careful adjustment
      // Use iterative approach: adjust by hours first, then check again
      const adjustmentMs = hourDiff * 60 * 60 * 1000;
      utcDate = new Date(utcDate.getTime() + adjustmentMs);
    }
    
    // Recalculate BA time
    baTime = toZonedTime(utcDate, BUENOS_AIRES_TIMEZONE);
    attempts++;
  }
  
  return utcDate;
}

/**
 * Formats a date in Buenos Aires timezone for display
 * 
 * @param date - Date object (can be UTC or have BA components stored as UTC)
 * @param formatStr - Format string for date-fns
 * @param options - Optional options including locale
 */
export function formatInBuenosAires(date: Date, formatStr: string, options?: { locale?: any }): string {
  return formatInTimeZone(date, BUENOS_AIRES_TIMEZONE, formatStr, options);
}

/**
 * Formats a date for datetime-local input in Buenos Aires timezone
 * Returns format: "yyyy-MM-ddTHH:mm" (no timezone offset)
 * 
 * This function assumes the Date object has BA time components stored as UTC components
 * (e.g., from fullCalendarDateToLocal which creates Date UTC with BA components).
 * 
 * @param date - Date object with BA time components stored as UTC components
 * @returns Formatted string for datetime-local input in BA timezone
 */
export function formatForDateTimeLocal(date: Date): string {
  // The Date object has BA time components stored as UTC components
  // (created by fullCalendarDateToLocal using Date.UTC)
  // We extract UTC components to get the BA time
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parses a datetime-local input value and converts it to a Date object
 * with BA time components stored as UTC components
 * 
 * @param datetimeLocalValue - String from datetime-local input (format: "yyyy-MM-ddTHH:mm")
 * @returns Date object with BA time components stored as UTC components
 */
export function parseFromDateTimeLocal(datetimeLocalValue: string): Date {
  // datetime-local input gives us a string like "2026-01-09T08:30"
  // This represents BA time that the user entered
  // We need to store it as UTC components (like fullCalendarDateToLocal does)
  const [datePart, timePart] = datetimeLocalValue.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create a Date UTC with these BA components
  // This ensures consistency with fullCalendarDateToLocal
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
}

/**
 * Serializes a Date object with BA time components (stored as UTC components) to ISO string
 * for sending to the API. 
 * 
 * The backend expects a Date object where getUTC* methods return BA time components.
 * When we create a Date from an ISO string without 'Z', JavaScript interprets it as local time.
 * But we want the backend to extract UTC components that represent BA time.
 * 
 * Solution: Create an ISO string with the BA components, but use 'Z' to indicate UTC.
 * When the backend does `new Date(isoString)`, it gets a Date in UTC.
 * Then utcToMySQLDate extracts the UTC components (which are BA time) correctly.
 * 
 * @param date - Date object with BA time components stored as UTC components
 * @returns ISO string that the backend can parse correctly
 */
export function serializeBATimeAsUTC(date: Date): string {
  // Extract the UTC components (which are actually BA time components)
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const milliseconds = date.getUTCMilliseconds();
  
  // Create a Date UTC with these components and convert to ISO
  // This ensures the ISO string represents these exact components as UTC
  const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds, milliseconds));
  return utcDate.toISOString();
}

export { toZonedTime } from "date-fns-tz";
