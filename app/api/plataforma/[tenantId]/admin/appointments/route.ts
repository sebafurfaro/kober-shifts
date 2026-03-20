import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  listAppointmentsForAdminRaw,
  listAppointmentsForAdminRawWithSearch,
  findUsersByIds,
  findLocationsByIds,
  findServicesByIds,
  hasProfessionalProfile,
} from "@/lib/db";
import { AppointmentStatus } from "@/lib/types";
import { mysqlDateToUTC } from "@/lib/timezone";

const PAGE_SIZE = 10;
type Filter = "proximos" | "hoy" | "manana" | "todos";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const filter = (url.searchParams.get("filter") || "todos") as Filter;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const search = (url.searchParams.get("search") || "").trim();

  const now = new Date();
  const tz = "America/Argentina/Buenos_Aires";
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: tz });
  const todayStart = new Date(`${todayStr}T00:00:00-03:00`);
  const todayEnd = new Date(`${todayStr}T23:59:59.999-03:00`);
  const todayMidday = new Date(`${todayStr}T12:00:00-03:00`);
  const tomorrowDate = new Date(todayMidday);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStrOnly = tomorrowDate.toLocaleDateString("en-CA", { timeZone: tz });
  const tomorrowStart = new Date(`${tomorrowStrOnly}T00:00:00-03:00`);
  const tomorrowEnd = new Date(`${tomorrowStrOnly}T23:59:59.999-03:00`);

  let startDate: Date | undefined;
  let endDate: Date | undefined;
  let statuses: AppointmentStatus[] | undefined;
  let orderBy: "startAt_asc" | "startAt_desc" = "startAt_asc";

  switch (filter) {
    case "proximos":
      startDate = now;
      endDate = new Date(now.getFullYear() + 2, 11, 31);
      statuses = [AppointmentStatus.CONFIRMED, AppointmentStatus.REQUESTED, AppointmentStatus.PENDING_DEPOSIT];
      orderBy = "startAt_asc";
      break;
    case "hoy":
      startDate = todayStart;
      endDate = todayEnd;
      orderBy = "startAt_asc";
      break;
    case "manana":
      startDate = tomorrowStart;
      endDate = tomorrowEnd;
      orderBy = "startAt_asc";
      break;
    case "todos":
      orderBy = "startAt_desc";
      break;
    default:
      startDate = now;
      endDate = new Date(now.getFullYear() + 2, 11, 31);
      statuses = [AppointmentStatus.CONFIRMED, AppointmentStatus.REQUESTED, AppointmentStatus.PENDING_DEPOSIT];
      orderBy = "startAt_asc";
  }

  // ADMIN ve todos los turnos del negocio; PROFESSIONAL ve solo los propios.
  const isProfessionalOnly = session.role === "PROFESSIONAL";
  const userHasProfile = isProfessionalOnly ? await hasProfessionalProfile(tenantId, session.userId) : false;
  const listOptions = {
    startDate,
    endDate,
    statuses,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    orderBy,
    professionalId: isProfessionalOnly && userHasProfile ? session.userId : undefined,
  };
  const { list: appointmentList, total } = search
    ? await listAppointmentsForAdminRawWithSearch(tenantId, { ...listOptions, search })
    : await listAppointmentsForAdminRaw(tenantId, listOptions);

  const patientIds = [...new Set(appointmentList.map((a) => a.patientId))];
  const professionalIds = [...new Set(appointmentList.map((a) => a.professionalId))];
  const locationIds = [...new Set(appointmentList.map((a) => a.locationId))];
  const serviceIds = [...new Set(appointmentList.map((a) => a.serviceId).filter(Boolean) as string[])];

  const [users, locations, services] = await Promise.all([
    findUsersByIds(tenantId, [...patientIds, ...professionalIds]),
    findLocationsByIds(tenantId, locationIds),
    findServicesByIds(tenantId, serviceIds),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const locationMap = new Map(locations.map((l) => [l.id, l]));
  const serviceMap = new Map(services.map((s) => [s.id, s]));

  const appointments = appointmentList.map((apt) => {
    const patient = userMap.get(apt.patientId);
    const professional = userMap.get(apt.professionalId);
    const location = locationMap.get(apt.locationId);
    const service = apt.serviceId ? serviceMap.get(apt.serviceId) : null;
    const displayFirstName = apt.patientFirstName ?? patient?.firstName ?? null;
    const displayLastName = apt.patientLastName ?? patient?.lastName ?? null;
    const displayName =
      (displayFirstName && displayLastName ? `${displayFirstName} ${displayLastName}`.trim() : null) ||
      patient?.name ||
      "—";
    const startDate = apt.startAt instanceof Date ? apt.startAt : new Date(apt.startAt);
    const endDate = apt.endAt instanceof Date ? apt.endAt : new Date(apt.endAt);
    const startAtISO = mysqlDateToUTC(startDate).toISOString();
    const endAtISO = mysqlDateToUTC(endDate).toISOString();
    const seniaAmount = service ? Math.round((service.price * service.seniaPercent) / 100 * 100) / 100 : null;
    return {
      id: apt.id,
      tenantId: apt.tenantId,
      status: apt.status,
      startAt: startAtISO,
      endAt: endAtISO,
      patientId: apt.patientId,
      professionalId: apt.professionalId,
      locationId: apt.locationId,
      serviceId: apt.serviceId ?? null,
      notes: apt.notes,
      cancellationReason: apt.cancellationReason,
      cancelledBy: apt.cancelledBy,
      patient: patient
        ? {
            id: patient.id,
            name: displayName,
            firstName: displayFirstName,
            lastName: displayLastName,
            email: patient.email,
            phone: patient.phone ?? null,
          }
        : {
            id: apt.patientId,
            name: displayName,
            firstName: displayFirstName,
            lastName: displayLastName,
            email: "",
            phone: null,
          },
      professional: professional
        ? { id: professional.id, name: professional.name, email: professional.email }
        : { id: apt.professionalId, name: "—", email: "" },
      location: location
        ? { id: location.id, name: location.name, address: location.address }
        : { id: apt.locationId, name: "—", address: "" },
      service: service
        ? {
            id: service.id,
            name: service.name,
            price: service.price,
            seniaPercent: service.seniaPercent,
            seniaAmount,
          }
        : null,
    };
  });

  return NextResponse.json({ appointments, total });
}
