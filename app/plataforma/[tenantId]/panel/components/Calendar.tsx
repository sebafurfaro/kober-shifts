"use client";

import React, { useRef, useState, useEffect, useCallback, startTransition } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Card,
  CardBody,
} from "@heroui/react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Toolbar } from "./calendar/Toolbar";

import { fullCalendarDateToLocal, localDateToFullCalendar, serializeBATimeAsUTC, toZonedTime, BUENOS_AIRES_TIMEZONE } from "@/lib/timezone";
import { EventDialogTitle } from "./calendar/EventDialogTitle";
import { EventDialogContent } from "./calendar/EventDialogContent";
import { EventDialogActions } from "./calendar/EventDialogActions";
import { ConfirmationDialog } from "./alerts/ConfirmationDialog";
import { AlertDialog } from "./alerts/AlertDialog";
import { useCreateAppointment } from "@/lib/use-create-appointment";
import { useAppointmentsInvalidationStore } from "@/lib/appointments-invalidation-store";
import { useTenantSettingsStore } from "@/lib/tenant-settings-store";

type ViewType = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  extendedProps: {
    patientId?: string;
    patientName?: string;
    patientEmail?: string;
    professionalId?: string;
    professionalName?: string;
    professionalEmail?: string;
    locationId?: string;
    locationName?: string;
    locationAddress?: string;
    status?: string;
    notes?: string | null;
    googleEventId?: string | null;
    cancellationReason?: string | null;
    cancelledBy?: string | null;
    isHoliday?: boolean;
    professionalHoliday?: boolean; // Key to identify professional holiday events
    holidayDescription?: string;
    holidayId?: string;
    holidayStartDate?: string;
    holidayEndDate?: string;
  };
  backgroundColor?: string;
  borderColor?: string;
  display?: string;
  classNames?: string[];
}

interface EventDialogData {
  id?: string;
  start: Date;
  end: Date;
  patientId?: string;
  professionalId?: string;
  locationId?: string;
  notes?: string;
}

export function Calendar() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = params.tenantId as string;
  const { createAppointment: createAppointmentApi } = useCreateAppointment(tenantId);
  const invalidateAppointments = useAppointmentsInvalidationStore((s) => s.invalidate);
  const defaultSlotDurationMinutes = useTenantSettingsStore((s) => s.bookingSettings.defaultSlotDurationMinutes) ?? 30;
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState<ViewType>("dayGridMonth");
  const [timezone, setTimezone] = useState<string>(BUENOS_AIRES_TIMEZONE);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const eventsRef = React.useRef<CalendarEvent[]>([]);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventDialogData, setEventDialogData] = useState<EventDialogData | null>(null);
  const [eventDialogMode, setEventDialogMode] = useState<"create" | "edit" | "view">("view");

  // Data for forms
  const [patients, setPatients] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [mounted, setMounted] = useState(false);

  // Flag to prevent multiple dateClick handlers from firing
  const dateClickProcessingRef = useRef(false);

  // Confirmation and alert dialogs
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
    type?: "warning" | "error" | "info" | "success";
  }>({
    open: false,
    message: "",
    onConfirm: () => { },
  });
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    message: string;
    type?: "error" | "info" | "success" | "warning";
  }>({
    open: false,
    message: "",
  });

  // Track last loaded date range to prevent redundant API calls
  const lastLoadedRangeRef = useRef<{ start: string; end: string } | null>(null);
  // Flag to prevent datesSet from triggering during state updates
  const isUpdatingRef = useRef(false);

  // Helper function to check if a date range overlaps with any holiday period for a professional
  const checkHolidayOverlap = useCallback((startDate: Date, endDate: Date, professionalId: string): { inHoliday: boolean; holiday?: any } => {
    const professional = professionals.find(p => p.id === professionalId);
    if (!professional || !professional.holidays || professional.holidays.length === 0) {
      return { inHoliday: false };
    }

    const appointmentStart = new Date(startDate);
    appointmentStart.setHours(0, 0, 0, 0);
    const appointmentEnd = new Date(endDate);
    appointmentEnd.setHours(23, 59, 59, 999);

    for (const holiday of professional.holidays) {
      const holidayStart = new Date(holiday.startDate);
      holidayStart.setHours(0, 0, 0, 0);
      const holidayEnd = new Date(holiday.endDate);
      holidayEnd.setHours(23, 59, 59, 999);

      // Check if appointment overlaps with holiday period
      // Overlap occurs if: appointmentStart <= holidayEnd && appointmentEnd >= holidayStart
      if (appointmentStart <= holidayEnd && appointmentEnd >= holidayStart) {
        return { inHoliday: true, holiday };
      }
    }

    return { inHoliday: false };
  }, [professionals]);

  // Set mounted flag to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Abrir diálogo "Agregar evento" cuando se navega con ?addEvent=1 (ej. desde Turnos). Opcional: ?date=YYYY-MM-DD&time=HH:mm
  useEffect(() => {
    if (!mounted) return;
    if (searchParams.get("addEvent") !== "1") return;
    const dateParam = searchParams.get("date");
    const timeParam = searchParams.get("time");
    let startDate: Date;
    let endDate: Date;
    if (dateParam && timeParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && /^\d{1,2}:\d{2}$/.test(timeParam)) {
      const [hours, minutes] = timeParam.split(":").map(Number);
      const [y, m, d] = dateParam.split("-").map(Number);
      startDate = new Date(Date.UTC(y, m - 1, d, hours, minutes, 0, 0));
      endDate = new Date(Date.UTC(y, m - 1, d, hours, minutes + 30, 0, 0));
    } else {
      const now = new Date();
      const baNow = toZonedTime(now, BUENOS_AIRES_TIMEZONE);
      startDate = new Date(Date.UTC(baNow.getFullYear(), baNow.getMonth(), baNow.getDate(), 9, 0, 0, 0));
      endDate = new Date(Date.UTC(baNow.getFullYear(), baNow.getMonth(), baNow.getDate(), 9, 30, 0, 0));
    }
    setEventDialogMode("create");
    setEventDialogData({ start: startDate, end: endDate });
    setEventDialogOpen(true);
    router.replace(`/plataforma/${tenantId}/panel`, { scroll: false });
  }, [mounted, tenantId, router, searchParams]);

  // Load FullCalendar styles from CDN to avoid Tailwind CSS v4 conflicts
  useEffect(() => {
    if (typeof document !== "undefined") {
      const links = [
        {
          id: "fc-core",
          href: "https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/main.min.css",
        },
        {
          id: "fc-daygrid",
          href: "https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.15/main.min.css",
        },
        {
          id: "fc-timegrid",
          href: "https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.15/main.min.css",
        },
      ];

      links.forEach(({ id, href }) => {
        if (!document.getElementById(id)) {
          const link = document.createElement("link");
          link.id = id;
          link.rel = "stylesheet";
          link.href = href;
          document.head.appendChild(link);
        }
      });
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [tenantId]);

  async function loadInitialData() {
    if (!tenantId) return;
    try {
      const [patientsRes, professionalsRes, locationsRes] = await Promise.all([
        fetch(`/api/plataforma/${tenantId}/admin/patients`).catch(() => null),
        fetch(`/api/plataforma/${tenantId}/admin/professionals`).catch(() => null),
        fetch(`/api/plataforma/${tenantId}/admin/locations`).catch(() => null),
      ]);

      if (patientsRes?.ok) {
        const data = await patientsRes.json();
        setPatients(Array.isArray(data) ? data : []);
      }
      if (professionalsRes?.ok) {
        const data = await professionalsRes.json();
        // Optimize: Only store necessary data to avoid WebSocket payload size issues
        const normalizedProfessionals = Array.isArray(data)
          ? data.map((p: any) => ({
            id: p.id,
            name: p.name,
            firstName: p.firstName ?? null,
            lastName: p.lastName ?? null,
            email: p.email,
            hasProfessionalProfile: !!p.professional,
            isActive: p.professional?.isActive !== false,
            color: (p.professional?.color && typeof p.professional.color === "string" && p.professional.color.trim() !== "")
              ? p.professional.color.trim()
              : "#2196f3",
            holidays: p.professional?.availabilityConfig?.holidays || [],
            availableDays: p.professional?.availableDays || null,
            availableHours: p.professional?.availableHours || null,
            availabilityConfig: p.professional?.availabilityConfig || null,
          }))
          : [];
        setProfessionals(normalizedProfessionals);
      }
      if (locationsRes?.ok) {
        const data = await locationsRes.json();
        setLocations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  }

  const loadEvents = useCallback(async (start: Date, end: Date, forceReload = false) => {
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    // Prevent redundant API calls (unless forced)
    if (
      !forceReload &&
      lastLoadedRangeRef.current?.start === startStr &&
      lastLoadedRangeRef.current?.end === endStr
    ) {
      return;
    }

    lastLoadedRangeRef.current = { start: startStr, end: endStr };
    isUpdatingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/appointments?start=${startStr}&end=${endStr}`);
      if (!res.ok) throw new Error("Failed to load events");
      const data = await res.json();

      // Generate holiday events from professionals' holidays data
      // These events are visible to ADMIN users to see who is on vacation
      const holidayEvents: CalendarEvent[] = [];
      professionals.forEach((professional) => {
        const holidays = professional.holidays || [];
        holidays.forEach((holiday: any) => {
          const startDate = new Date(holiday.startDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(holiday.endDate);
          endDate.setHours(23, 59, 59, 999);

          // Only include holidays that overlap with the requested date range
          if (endDate >= start && startDate <= end) {
            const holidayTitle = holiday.description 
              ? `🏖️ ${professional.name} - ${holiday.description}`
              : `🏖️ ${professional.name} - Vacaciones`;
            
            holidayEvents.push({
              id: `holiday-${professional.id}-${holiday.id}`,
              title: holidayTitle,
              start: startDate.toISOString(),
              end: endDate.toISOString(),
              extendedProps: {
                professionalId: professional.id,
                professionalName: professional.name,
                professionalEmail: professional.email,
                isHoliday: true,
                professionalHoliday: true, // Key to identify professional holiday events
                holidayDescription: holiday.description,
                holidayId: holiday.id,
                holidayStartDate: holiday.startDate,
                holidayEndDate: holiday.endDate,
              },
              backgroundColor: '#ff9800',
              borderColor: '#ff9800',
              display: 'block', // Show as regular events, not just background
              classNames: ['holiday-event', 'professional-holiday'],
            });
          }
        });
      });

      // Combine appointments and holiday events
      const allEvents = [...data, ...holidayEvents];

      // Check if events actually changed before updating
      const eventsChanged =
        eventsRef.current.length !== allEvents.length ||
        JSON.stringify(eventsRef.current.map(e => e.id).sort()) !==
        JSON.stringify(allEvents.map((e: any) => e.id).sort());

      if (eventsChanged) {
        eventsRef.current = allEvents;
        // Use requestAnimationFrame to batch the update and prevent datesSet from firing
        requestAnimationFrame(() => {
          setEvents(allEvents);
          // Reset flag after events are set and React has processed the update
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 100);
        });
      } else {
        // Events didn't change, just reset the flag
        isUpdatingRef.current = false;
      }
    } catch (error) {
      console.error("Error loading events:", error);
      // Reset ref on error so we can retry
      lastLoadedRangeRef.current = null;
    } finally {
      setLoading(false);
      // Note: isUpdatingRef is reset inside the setTimeout above after setEvents
    }
  }, [tenantId, professionals]);

  const handleDatesSet = useCallback((arg: { start: Date; end: Date; view: any }) => {
    // Prevent recursive calls during state updates
    if (isUpdatingRef.current) {
      return;
    }

    // Load events (this function has its own deduplication)
    loadEvents(arg.start, arg.end);

    // Calculate the date to display in the title
    // For month view, we need to find the month that's primarily visible
    // activeStart might be from the previous month if the month starts mid-week
    let newDate: Date;

    if (arg.view.type === "dayGridMonth") {
      // For month view, find the primary month being displayed
      // Use the middle of the range to get a date that's definitely in the primary month
      const midTime = (arg.start.getTime() + arg.end.getTime()) / 2;
      const midDate = new Date(midTime);
      // Get the first day of that month for a clean title
      const firstOfMonth = new Date(midDate.getFullYear(), midDate.getMonth(), 1);
      newDate = firstOfMonth;
    } else {
      // For week/day views, use activeStart
      newDate = new Date(arg.view.activeStart);
    }

    startTransition(() => {
      // Always update currentDate to ensure title matches the visible calendar
      // isUpdatingRef prevents infinite loops, so we can safely update here
      setCurrentDate(newDate);

      setCurrentView((prevView) => {
        return arg.view.type !== prevView ? (arg.view.type as ViewType) : prevView;
      });
    });
  }, [loadEvents]);

  function handleEventClick(info: any) {
    const event = info.event;

    // Convert FullCalendar event to our CalendarEvent format
    const calendarEvent: CalendarEvent = {
      id: event.id,
      title: event.title,
      start: typeof event.start === 'string' ? event.start : event.start.toISOString(),
      end: typeof event.end === 'string' ? event.end : (event.end || event.start).toISOString(),
      extendedProps: event.extendedProps || {},
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
    };
    setSelectedEvent(calendarEvent);
    
    // Holiday events are view-only, regular appointments can be edited
    if (event.extendedProps?.isHoliday || event.extendedProps?.professionalHoliday) {
      setEventDialogMode("view");
    } else {
      setEventDialogMode("view");
    }

    // Convert FullCalendar dates to local dates using centralized timezone utilities
    const startDate = event.start instanceof Date
      ? fullCalendarDateToLocal(event.start)
      : fullCalendarDateToLocal(new Date(event.start));
    const endDate = (event.end || event.start) instanceof Date
      ? fullCalendarDateToLocal(event.end || event.start)
      : fullCalendarDateToLocal(new Date(event.end || event.start));

    setEventDialogData({
      id: event.id,
      start: startDate,
      end: endDate,
      patientId: event.extendedProps?.patientId,
      professionalId: event.extendedProps?.professionalId,
      locationId: event.extendedProps?.locationId,
      notes: event.extendedProps?.notes || undefined,
    });
    setEventDialogOpen(true);
  }

  function handleCreateButtonClick() {
    setEventDialogMode("create");

    const now = new Date();
    let baseDate = new Date(now);

    // Determine if "now" is within the current view context
    let isTodayInView = false;

    if (currentView === "dayGridMonth") {
      isTodayInView = now.getMonth() === currentDate.getMonth() &&
        now.getFullYear() === currentDate.getFullYear();
    } else if (currentView === "timeGridWeek") {
      // Check if now is within the week starting at currentDate
      // We assume currentDate is the start of the week
      const diffTime = now.getTime() - currentDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      isTodayInView = diffDays >= 0 && diffDays < 7;
    } else if (currentView === "timeGridDay") {
      isTodayInView = now.getDate() === currentDate.getDate() &&
        now.getMonth() === currentDate.getMonth() &&
        now.getFullYear() === currentDate.getFullYear();
    }

    if (!isTodayInView) {
      baseDate = new Date(currentDate);
      // Keep current time
      baseDate.setHours(now.getHours(), now.getMinutes());
    }

    const startDate = fullCalendarDateToLocal(baseDate);
    const endDate = new Date(startDate);
    endDate.setUTCMinutes(endDate.getUTCMinutes() + defaultSlotDurationMinutes);

    setEventDialogData({
      start: startDate,
      end: endDate,
    });
    setEventDialogOpen(true);
  }

  function handleDateClick(clickInfo: any) {
    // Prevent multiple simultaneous calls
    if (dateClickProcessingRef.current) {
      return;
    }

    dateClickProcessingRef.current = true;

    try {
      setEventDialogMode("create");

      // clickInfo.date contains the date and time clicked in FullCalendar
      // When timeZone is set, FullCalendar's Date object has special behavior:
      // getUTC* methods return the DISPLAYED time in the configured timezone
      // Example: User clicks 09:30 BA -> getUTCHours() returns 9 (not 12)
      const clickedDate = clickInfo.date instanceof Date
        ? clickInfo.date
        : new Date(clickInfo.date);

      // Convert FullCalendar date to Date with BA components stored as UTC
      // fullCalendarDateToLocal extracts the displayed BA time directly from UTC methods
      const startDate = fullCalendarDateToLocal(clickedDate);

      const isDayGridView = clickInfo?.view?.type?.startsWith("dayGrid");
      if (clickInfo?.allDay || isDayGridView) {
        // Month view clicks default to a specific hour to avoid date shifts
        startDate.setUTCHours(9, 0, 0, 0);
      }

      // Set default duration from tenant settings
      const endDate = new Date(startDate);
      endDate.setUTCMinutes(endDate.getUTCMinutes() + defaultSlotDurationMinutes);

      // Set event dialog data with the captured times
      // These dates will be displayed in the modal using formatForDateTimeLocal
      // and when saved, converted back to UTC using localDateToFullCalendar
      setEventDialogData({
        start: startDate,
        end: endDate,
      });
      setEventDialogOpen(true);
    } finally {
      // Reset flag after a short delay to allow state updates to complete
      setTimeout(() => {
        dateClickProcessingRef.current = false;
      }, 100);
    }
  }

  function handleDateSelect(selectInfo: any) {
    setEventDialogMode("create");

    // Convert FullCalendar dates to local dates using centralized timezone utilities
    const startDate = selectInfo.start instanceof Date
      ? fullCalendarDateToLocal(selectInfo.start)
      : fullCalendarDateToLocal(new Date(selectInfo.start));
    const endDate = (selectInfo.end || selectInfo.start) instanceof Date
      ? fullCalendarDateToLocal(selectInfo.end || selectInfo.start)
      : fullCalendarDateToLocal(new Date(selectInfo.end || selectInfo.start));

    setEventDialogData({
      start: startDate,
      end: endDate,
    });
    setEventDialogOpen(true);
  }

  function handleEventChange(changeInfo: any) {
    const event = changeInfo.event;
    
    // Prevent dragging/resizing holiday events
    if (event.extendedProps?.isHoliday) {
      // Revert the change by reloading events
      if (calendarRef.current) {
        const calendar = calendarRef.current.getApi();
        loadEvents(calendar.view.activeStart, calendar.view.activeEnd, true);
      }
      return;
    }
    
    updateEvent(event.id, {
      startAt: event.start,
      endAt: event.end || event.start,
    });
  }

  async function updateEvent(id: string, data: { startAt: Date; endAt: Date }) {
    try {
      // When FullCalendar has timeZone configured, event.start and event.end
      // are Date objects in UTC. We need to convert them using fullCalendarDateToLocal
      // first, then localDateToFullCalendar to send to API
      const startDate = fullCalendarDateToLocal(data.startAt);
      const endDate = fullCalendarDateToLocal(data.endAt);

      const startUTC = localDateToFullCalendar(startDate);
      const endUTC = localDateToFullCalendar(endDate);

      const res = await fetch(`/api/plataforma/${tenantId}/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startAt: startUTC.toISOString(),
          endAt: endUTC.toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to update event");
      // Reload events
      if (calendarRef.current) {
        const calendar = calendarRef.current.getApi();
        loadEvents(calendar.view.activeStart, calendar.view.activeEnd, true);
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  }

  function handleViewChange(view: ViewType) {
    setCurrentView(view);
    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      calendar.changeView(view);
    }
  }

  function handleToday() {
    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      calendar.today();
      // Update title to match the calendar's visible date
      // The datesSet handler will update it, but we can set it immediately for better UX
      setCurrentDate(new Date(calendar.view.activeStart));
    }
  }

  function handlePrev() {
    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      calendar.prev();
      // Update title after navigation
      setTimeout(() => {
        if (calendarRef.current) {
          const cal = calendarRef.current.getApi();
          setCurrentDate(new Date(cal.view.activeStart));
        }
      }, 0);
    }
  }

  function handleNext() {
    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      calendar.next();
      // Update title after navigation
      setTimeout(() => {
        if (calendarRef.current) {
          const cal = calendarRef.current.getApi();
          setCurrentDate(new Date(cal.view.activeStart));
        }
      }, 0);
    }
  }

  const statusColors: Record<string, string> = {
    REQUESTED: "#ff9800",
    PENDING_DEPOSIT: "#e65100",
    CONFIRMED: "#4caf50",
    CANCELLED: "#f44336",
    ATTENDED: "#2196f3",
  };

  const statusLabels: Record<string, string> = {
    REQUESTED: "Solicitado",
    PENDING_DEPOSIT: "Pendiente de seña",
    CONFIRMED: "Confirmado",
    CANCELLED: "Cancelado",
    ATTENDED: "Atendido",
  };

  // Spanish locale configuration for FullCalendar
  const spanishLocale = {
    code: "es",
    buttonText: {
      today: "Hoy",
      month: "Mes",
      week: "Semana",
      day: "Día",
    },
    allDayText: "Todo el día",
    moreLinkText: "más",
    noEventsText: "No hay eventos",
    weekText: "Sem",
    dayNames: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    monthNames: [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ],
    monthNamesShort: [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ],
  } as const;

  return (
    <div className="h-full flex flex-col mt-8">
      {/* Toolbar */}
      <Toolbar
        currentDate={currentDate}
        onToday={handleToday}
        onPrev={handlePrev}
        onNext={handleNext}
        currentView={currentView}
        onViewChange={handleViewChange}
        onCreateEvent={handleCreateButtonClick}
        timezone={timezone}
        onTimezoneChange={setTimezone}
      />

      {/* Leyenda: solo profesionales con perfil (color + nombre), no admins sin perfil */}
      {(() => {
        const professionalsWithProfile = professionals.filter((pro) => pro.hasProfessionalProfile);
        return professionalsWithProfile.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {professionalsWithProfile.map((pro) => (
            <div
              key={pro.id}
              className="flex items-center gap-2 shrink-0 rounded-md border border-gray-200 bg-white px-3 py-1.5 shadow-sm"
            >
              <span
                className="block w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: pro.color ?? "#2196f3" }}
                aria-hidden
              />
              <span
                className="text-sm font-medium text-slate-800 truncate max-w-[180px]"
                title={[pro.firstName, pro.lastName].filter(Boolean).join(" ").trim() || pro.name || ""}
              >
                {[pro.firstName, pro.lastName].filter(Boolean).join(" ").trim() || pro.name || "Sin nombre"}
              </span>
            </div>
          ))}
        </div>
        ) : null;
      })()}

      {/* Calendar */}
      <Card className="p-4 mb-4">
        <CardBody className="p-0">
          {mounted && (
            <div className="grow min-h-0 [&_.fc]:h-full">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={currentView}
                headerToolbar={false}
                events={events}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                dateClick={handleDateClick}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventChange={handleEventChange}
                datesSet={handleDatesSet}
                timeZone={timezone}
                firstDay={1}
                locale={spanishLocale as any}
                height="auto"
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                allDaySlot={false}
                contentHeight="auto"
                eventAllow={(dropInfo, draggedEvent) => {
                  // Prevent dragging holiday events
                  if (draggedEvent && draggedEvent.extendedProps?.isHoliday) {
                    return false;
                  }
                  return true;
                }}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Event Dialog */}
      {mounted && (
        <Modal
          isOpen={eventDialogOpen}
          onClose={() => setEventDialogOpen(false)}
          size="md"
          scrollBehavior="inside"
          classNames={{
            wrapper: "z-[99999]"
          }}
        >
          <ModalContent>
            <ModalHeader>
              <EventDialogTitle
                mode={eventDialogMode}
                eventId={selectedEvent?.id || eventDialogData?.id}
              />
            </ModalHeader>
            <ModalBody>
              <EventDialogContent
                mode={eventDialogMode}
                selectedEvent={selectedEvent}
                eventDialogData={eventDialogData}
                onDataChange={setEventDialogData}
                patients={patients}
                professionals={professionals.filter((p) => p.hasProfessionalProfile && p.isActive)}
                locations={locations}
                timezone={timezone}
                statusColors={statusColors}
                statusLabels={statusLabels}
              />
            </ModalBody>
            <ModalFooter>
              <EventDialogActions
                mode={eventDialogMode}
                selectedEventId={selectedEvent?.id}
                eventDialogData={eventDialogData}
                isHolidayEvent={selectedEvent?.extendedProps?.professionalHoliday || selectedEvent?.extendedProps?.isHoliday || false}
                onEdit={() => setEventDialogMode("edit")}
                onDelete={async () => {
                  if (!selectedEvent) return;
                  setConfirmationDialog({
                    open: true,
                    message: "¿Está seguro de que desea eliminar este turno?",
                    type: "warning",
                    onConfirm: async () => {
                      try {
                        const res = await fetch(`/api/plataforma/${tenantId}/appointments/${selectedEvent.id}`, {
                          method: "DELETE",
                        });
                        if (!res.ok) throw new Error("Failed to delete appointment");
                        invalidateAppointments();
                        setEventDialogOpen(false);
                        if (calendarRef.current) {
                          const calendar = calendarRef.current.getApi();
                          loadEvents(calendar.view.activeStart, calendar.view.activeEnd, true);
                        }
                      } catch (error) {
                        console.error("Error deleting appointment:", error);
                        setAlertDialog({
                          open: true,
                          message: "Error al eliminar el turno",
                          type: "error",
                        });
                      }
                    },
                  });
                }}
                onCancel={() => {
                  if (eventDialogMode === "edit") {
                    setEventDialogMode("view");
                  } else {
                    setEventDialogOpen(false);
                  }
                }}
                onSave={async () => {
                  if (!eventDialogData) return;

                  // Default section visibility
                  const showLocations = true;
                  // Validate required fields (only those that are visible)
                  if (!eventDialogData.patientId || !eventDialogData.professionalId) {
                    setAlertDialog({
                      open: true,
                      message: "Por favor complete todos los campos requeridos",
                      type: "warning",
                    });
                    return;
                  }

                  if (showLocations && !eventDialogData.locationId) {
                    setAlertDialog({
                      open: true,
                      message: "Por favor seleccione una ubicación",
                      type: "warning",
                    });
                    return;
                  }

                  // Validate professional availability
                  if (eventDialogData.professionalId) {
                    const selectedProfessional = professionals.find(p => p.id === eventDialogData.professionalId);
                    if (selectedProfessional) {
                      // Check if the appointment dates overlap with a holiday period
                      const holidayCheck = checkHolidayOverlap(eventDialogData.start, eventDialogData.end, eventDialogData.professionalId);
                      
                      if (holidayCheck.inHoliday && holidayCheck.holiday) {
                        const holiday = holidayCheck.holiday;
                        const holidayStart = new Date(holiday.startDate);
                        const holidayEnd = new Date(holiday.endDate);
                        const formatDate = (date: Date) => {
                          return date.toLocaleDateString('es-AR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                        };
                        const holidayDescription = holiday.description ? ` (${holiday.description})` : '';
                        setAlertDialog({
                          open: true,
                          message: `No se puede crear un turno durante el período vacacional del profesional ${selectedProfessional.name}. Período vacacional: del ${formatDate(holidayStart)} al ${formatDate(holidayEnd)}${holidayDescription}.`,
                          type: "warning",
                        });
                        return;
                      }

                      const availableDays = selectedProfessional.availableDays;
                      const availableHours = selectedProfessional.availableHours;

                      // Check if professional has availability configured
                      if (availableDays && availableDays.length > 0) {
                        // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
                        const eventDay = eventDialogData.start.getUTCDay();
                        if (!availableDays.includes(eventDay)) {
                          const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                          const availableDayNames = availableDays
                            .sort((a: number, b: number) => a - b)
                            .map((d: number) => dayNames[d])
                            .join(", ");
                          setAlertDialog({
                            open: true,
                            message: `El profesional ${selectedProfessional.name} no está disponible los ${dayNames[eventDay]}. Días disponibles: ${availableDayNames}`,
                            type: "warning",
                          });
                          return;
                        }
                      }

                      // Check if professional has hours configured
                      if (availableHours && availableHours.start && availableHours.end) {
                        const eventStartHour = eventDialogData.start.getUTCHours();
                        const eventStartMinute = eventDialogData.start.getUTCMinutes();
                        const eventEndHour = eventDialogData.end.getUTCHours();
                        const eventEndMinute = eventDialogData.end.getUTCMinutes();

                        const [startHour, startMin] = availableHours.start.split(":").map(Number);
                        const [endHour, endMin] = availableHours.end.split(":").map(Number);

                        const eventStartMinutes = eventStartHour * 60 + eventStartMinute;
                        const eventEndMinutes = eventEndHour * 60 + eventEndMinute;
                        const availableStartMinutes = startHour * 60 + startMin;
                        const availableEndMinutes = endHour * 60 + endMin;

                        if (eventStartMinutes < availableStartMinutes || eventEndMinutes > availableEndMinutes) {
                          setAlertDialog({
                            open: true,
                            message: `El profesional ${selectedProfessional.name} solo está disponible de ${availableHours.start} a ${availableHours.end}`,
                            type: "warning",
                          });
                          return;
                        }
                      }
                    }
                  }
                  if (!eventDialogData.start || !eventDialogData.end) {
                    setAlertDialog({
                      open: true,
                      message: "Por favor seleccione las fechas de inicio y fin",
                      type: "warning",
                    });
                    return;
                  }
                  if (eventDialogData.end <= eventDialogData.start) {
                    setAlertDialog({
                      open: true,
                      message: "La fecha de fin debe ser posterior a la fecha de inicio",
                      type: "warning",
                    });
                    return;
                  }
                  try {
                    if (eventDialogMode === "create") {
                      await createAppointmentApi(
                        {
                          patientId: eventDialogData.patientId!,
                          professionalId: eventDialogData.professionalId!,
                          locationId: showLocations ? eventDialogData.locationId ?? null : null,
                          startAt: serializeBATimeAsUTC(eventDialogData.start),
                          endAt: serializeBATimeAsUTC(eventDialogData.end),
                          notes: eventDialogData.notes || null,
                        },
                        {
                          onSuccess: () => {
                            setEventDialogOpen(false);
                            setEventDialogMode("view");
                            if (calendarRef.current) {
                              const calendar = calendarRef.current.getApi();
                              setTimeout(() => {
                                loadEvents(calendar.view.activeStart, calendar.view.activeEnd, true);
                              }, 100);
                            }
                          },
                        }
                      );
                    } else {
                      const res = await fetch(
                        `/api/plataforma/${tenantId}/appointments/${eventDialogData.id}`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            patientId: eventDialogData.patientId,
                            professionalId: eventDialogData.professionalId,
                            locationId: showLocations ? eventDialogData.locationId : null,
                            startAt: serializeBATimeAsUTC(eventDialogData.start),
                            endAt: serializeBATimeAsUTC(eventDialogData.end),
                            notes: eventDialogData.notes || null,
                          }),
                        }
                      );
                      if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        throw new Error(errorData.error || "Failed to save");
                      }
                      invalidateAppointments();
                      setEventDialogOpen(false);
                      setEventDialogMode("view");
                      if (calendarRef.current) {
                        const calendar = calendarRef.current.getApi();
                        setTimeout(() => {
                          loadEvents(calendar.view.activeStart, calendar.view.activeEnd, true);
                        }, 100);
                      }
                    }
                  } catch (error) {
                    console.error("Error saving event:", error);
                    setAlertDialog({
                      open: true,
                      message: error instanceof Error ? error.message : "Error al guardar el turno",
                      type: "error",
                    });
                  }
                }}
              />
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmationDialog.open}
        onClose={() => setConfirmationDialog({ ...confirmationDialog, open: false })}
        onConfirm={confirmationDialog.onConfirm}
        message={confirmationDialog.message}
        type={confirmationDialog.type}
      />

      {/* Alert Dialog */}
      <AlertDialog
        open={alertDialog.open}
        onClose={() => setAlertDialog({ ...alertDialog, open: false })}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}

