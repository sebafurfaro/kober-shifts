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
import { useParams } from "next/navigation";
import { Toolbar } from "./calendar/Toolbar";

import { fullCalendarDateToLocal, localDateToFullCalendar } from "@/lib/timezone";
import { EventDialogTitle } from "./calendar/EventDialogTitle";
import { EventDialogContent } from "./calendar/EventDialogContent";
import { EventDialogActions } from "./calendar/EventDialogActions";
import { ConfirmationDialog } from "./alerts/ConfirmationDialog";
import { AlertDialog } from "./alerts/AlertDialog";

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
    specialtyId?: string;
    specialtyName?: string;
    status?: string;
    notes?: string | null;
    googleEventId?: string | null;
    cancellationReason?: string | null;
    cancelledBy?: string | null;
  };
  backgroundColor?: string;
  borderColor?: string;
}

interface EventDialogData {
  id?: string;
  start: Date;
  end: Date;
  patientId?: string;
  professionalId?: string;
  locationId?: string;
  specialtyId?: string;
  notes?: string;
}

export function Calendar() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState<ViewType>("dayGridMonth");
  const [timezone, setTimezone] = useState<string>("America/Argentina/Buenos_Aires");
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
  const [specialties, setSpecialties] = useState<any[]>([]);
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

  // Set mounted flag to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

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
      const [patientsRes, professionalsRes, locationsRes, specialtiesRes] = await Promise.all([
        fetch(`/api/plataforma/${tenantId}/admin/patients`).catch(() => null),
        fetch(`/api/plataforma/${tenantId}/admin/professionals`).catch(() => null),
        fetch(`/api/plataforma/${tenantId}/admin/locations`).catch(() => null),
        fetch(`/api/plataforma/${tenantId}/admin/specialties`).catch(() => null),
      ]);

      if (patientsRes?.ok) {
        const data = await patientsRes.json();
        setPatients(Array.isArray(data) ? data : []);
      }
      if (professionalsRes?.ok) {
        const data = await professionalsRes.json();
        // Keep full professional data including specialty information
        const normalizedProfessionals = Array.isArray(data)
          ? data.map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            professional: p.professional || null,
            specialtyId: p.professional?.specialtyId || null,
            specialty: p.professional?.specialty || null,
            specialtyIds: p.professional?.specialtyIds || (p.professional?.specialtyId ? [p.professional.specialtyId] : []),
            availableDays: p.professional?.availableDays || null,
            availableHours: p.professional?.availableHours || null,
          }))
          : [];
        setProfessionals(normalizedProfessionals);
      }
      if (locationsRes?.ok) {
        const data = await locationsRes.json();
        setLocations(Array.isArray(data) ? data : []);
      }
      if (specialtiesRes?.ok) {
        const data = await specialtiesRes.json();
        setSpecialties(Array.isArray(data) ? data : []);
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

      // Generate holiday events from professionals' availabilityConfig
      const holidayEvents: CalendarEvent[] = [];
      professionals.forEach((professional) => {
        const holidays = professional.professional?.availabilityConfig?.holidays || [];
        holidays.forEach((holiday: any) => {
          const startDate = new Date(holiday.startDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(holiday.endDate);
          endDate.setHours(23, 59, 59, 999);

          // Only include holidays that overlap with the requested date range
          if (endDate >= start && startDate <= end) {
            holidayEvents.push({
              id: `holiday-${professional.id}-${holiday.id}`,
              title: `Vacaciones: ${professional.name}${holiday.description ? ` - ${holiday.description}` : ''}`,
              start: startDate.toISOString(),
              end: endDate.toISOString(),
              extendedProps: {
                professionalId: professional.id,
                professionalName: professional.name,
                isHoliday: true,
                holidayDescription: holiday.description,
              },
              backgroundColor: '#ff9800',
              borderColor: '#ff9800',
              display: 'background',
              classNames: ['holiday-event'],
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
    setEventDialogMode("view");

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
      specialtyId: event.extendedProps?.specialtyId,
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
    const defaultDurationMinutes = 30;
    const endDate = new Date(startDate);
    endDate.setUTCMinutes(endDate.getUTCMinutes() + defaultDurationMinutes);

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

      // Set default duration (30 minutes)
      // The end date is created from the start date to maintain timezone consistency
      const defaultDurationMinutes = 30;
      const endDate = new Date(startDate);
      endDate.setUTCMinutes(endDate.getUTCMinutes() + defaultDurationMinutes);

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
    CONFIRMED: "#4caf50",
    CANCELLED: "#f44336",
    ATTENDED: "#2196f3",
  };

  const statusLabels: Record<string, string> = {
    REQUESTED: "Solicitado",
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

      {/* Calendar */}
      <Card className="p-4 mb-4">
        <CardBody className="p-0">
          {mounted && (
            <div className="flex-grow min-h-0 [&_.fc]:h-full">
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
                professionals={professionals}
                locations={locations}
                specialties={specialties}
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
                  const showSpecialties = true;

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

                  if (showSpecialties && !eventDialogData.specialtyId) {
                    setAlertDialog({
                      open: true,
                      message: "Por favor seleccione una especialidad",
                      type: "warning",
                    });
                    return;
                  }

                  // Validate professional availability
                  if (eventDialogData.professionalId) {
                    const selectedProfessional = professionals.find(p => p.id === eventDialogData.professionalId);
                    if (selectedProfessional) {
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
                    const res = await fetch(
                      eventDialogMode === "edit"
                        ? `/api/appointments/${eventDialogData.id}`
                        : "/api/appointments",
                      {
                        method: eventDialogMode === "edit" ? "PATCH" : "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...(eventDialogMode === "edit" && { id: eventDialogData.id }),
                          patientId: eventDialogData.patientId,
                          professionalId: eventDialogData.professionalId,
                          locationId: showLocations ? eventDialogData.locationId : null,
                          specialtyId: showSpecialties ? eventDialogData.specialtyId : null,
                          startAt: eventDialogData.start.toISOString(),
                          endAt: eventDialogData.end.toISOString(),
                          notes: eventDialogData.notes || null,
                        }),
                      }
                    );
                    if (!res.ok) {
                      const errorData = await res.json().catch(() => ({}));
                      throw new Error(errorData.error || "Failed to save");
                    }
                    setEventDialogOpen(false);
                    setEventDialogMode("view");
                    // Force reload to get updated event with professional color
                    if (calendarRef.current) {
                      const calendar = calendarRef.current.getApi();
                      // Small delay to ensure database is updated
                      setTimeout(() => {
                        loadEvents(calendar.view.activeStart, calendar.view.activeEnd, true);
                      }, 100);
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

