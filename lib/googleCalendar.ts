import { getCalendarClient } from "./googleOAuth";

export async function createAppointmentEvent(input: {
  accessToken: string;
  refreshToken: string;
  calendarId?: string;
  summary: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  attendeeEmails?: string[];
}) {
  const calendar = await getCalendarClient(input.accessToken, input.refreshToken);
  const res = await calendar.events.insert({
    calendarId: input.calendarId ?? "primary",
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startAt.toISOString() },
      end: { dateTime: input.endAt.toISOString() },
      attendees: input.attendeeEmails?.map((email) => ({ email })),
    },
    sendUpdates: "all",
  });
  return res.data;
}

export async function updateAppointmentEventStatus(input: {
  accessToken: string;
  refreshToken: string;
  calendarId?: string;
  eventId: string;
  summary?: string;
  description?: string;
}) {
  const calendar = await getCalendarClient(input.accessToken, input.refreshToken);
  const res = await calendar.events.patch({
    calendarId: input.calendarId ?? "primary",
    eventId: input.eventId,
    requestBody: {
      summary: input.summary,
      description: input.description,
    },
    sendUpdates: "all",
  });
  return res.data;
}

export async function cancelAppointmentEvent(input: {
  accessToken: string;
  refreshToken: string;
  calendarId?: string;
  eventId: string;
}) {
  const calendar = await getCalendarClient(input.accessToken, input.refreshToken);
  await calendar.events.delete({
    calendarId: input.calendarId ?? "primary",
    eventId: input.eventId,
    sendUpdates: "all",
  });
}


