import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAppointmentById, updateAppointment, findAppointmentWithRelations, deleteAppointment, findServiceById } from "@/lib/db";
import { AppointmentStatus, Role } from "@/lib/types";
import { utcToMySQLDate } from "@/lib/timezone";
import mysql from "@/lib/mysql";
import { randomUUID } from "crypto";
import { renderBasicTemplate, sendMail, getTurnoConfirmadoPacienteContent, formatLocationAddress } from "@/lib/email";
import { mysqlDateToUTC, formatInBuenosAires } from "@/lib/timezone";
import { getTenantSettingsRow } from "@/lib/settings-db";

async function ensurePaymentsTable() {
  await mysql.execute(`
    CREATE TABLE IF NOT EXISTS appointment_payments (
      id VARCHAR(36) PRIMARY KEY,
      tenantId VARCHAR(255) NOT NULL,
      appointmentId VARCHAR(255) NOT NULL,
      provider VARCHAR(50) NOT NULL,
      purpose VARCHAR(20) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      status VARCHAR(30) NOT NULL,
      preferenceId VARCHAR(255),
      paymentId VARCHAR(255),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_appt_payments_tenant (tenantId),
      INDEX idx_appt_payments_appointment (appointmentId),
      INDEX idx_appt_payments_preference (preferenceId)
    )
  `);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const appointment = await findAppointmentById(id, tenantId);
  if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check permissions
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL" && appointment.patientId !== session.userId && appointment.professionalId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse dates from ISO string and convert to MySQL format
  let startAt: Date | undefined = undefined;
  let endAt: Date | undefined = undefined;

  if (typeof body.startAt === "string") {
    const utcDate = new Date(body.startAt);
    startAt = utcToMySQLDate(utcDate);
  }

  if (typeof body.endAt === "string") {
    const utcDate = new Date(body.endAt);
    endAt = utcToMySQLDate(utcDate);
  }
  const status: AppointmentStatus | undefined = typeof body.status === "string"
    ? (body.status === AppointmentStatus.REQUESTED ? AppointmentStatus.REQUESTED
      : body.status === AppointmentStatus.PENDING_DEPOSIT ? AppointmentStatus.PENDING_DEPOSIT
      : body.status === AppointmentStatus.CONFIRMED ? AppointmentStatus.CONFIRMED
      : body.status === AppointmentStatus.CANCELLED ? AppointmentStatus.CANCELLED
      : body.status === AppointmentStatus.ATTENDED ? AppointmentStatus.ATTENDED
      : undefined)
    : undefined;
  const notes = typeof body.notes === "string" ? body.notes : body.notes === null ? null : undefined;
  const patientId = typeof body.patientId === "string" ? body.patientId : undefined;
  const professionalId = typeof body.professionalId === "string" ? body.professionalId : undefined;
  const locationId = typeof body.locationId === "string" ? body.locationId : undefined;

  const updated = await updateAppointment({
    id,
    tenantId,
    ...(startAt && { startAt }),
    ...(endAt && { endAt }),
    ...(status && { status }),
    ...(notes !== undefined && { notes }),
    ...(patientId && { patientId }),
    ...(professionalId && { professionalId }),
    ...(locationId && { locationId }),
  });

  if (status === AppointmentStatus.CONFIRMED && appointment.status === AppointmentStatus.PENDING_DEPOSIT) {
    try {
      await ensurePaymentsTable();
      const [result] = await mysql.execute(
        `UPDATE appointment_payments
         SET status = 'approved', updatedAt = CURRENT_TIMESTAMP
         WHERE tenantId = ? AND appointmentId = ? AND status <> 'approved'`,
        [tenantId, id]
      );
      const updatedRows = Number((result as { affectedRows?: number }).affectedRows ?? 0);
      if (updatedRows === 0 && appointment.serviceId) {
        const service = await findServiceById(appointment.serviceId, tenantId);
        if (service) {
          const amount = Math.round((service.price * service.seniaPercent) / 100 * 100) / 100;
          if (Number.isFinite(amount) && amount > 0) {
            await mysql.execute(
              `INSERT INTO appointment_payments
               (id, tenantId, appointmentId, provider, purpose, amount, status, preferenceId, paymentId)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                randomUUID(),
                tenantId,
                id,
                "manual",
                "deposit",
                amount,
                "approved",
                null,
                null,
              ]
            );
          }
        }
      }
    } catch (error) {
      console.error("Error marking appointment payment as approved:", error);
    }
  }

  if (status === AppointmentStatus.CONFIRMED && appointment.status !== AppointmentStatus.CONFIRMED) {
    try {
      const [settingsRow, data] = await Promise.all([
        getTenantSettingsRow(tenantId),
        findAppointmentWithRelations(id, tenantId),
      ]);
      const settings = (settingsRow?.settings && typeof settingsRow.settings === "object")
        ? settingsRow.settings as Record<string, unknown>
        : {};
      const sendEmailConfirmation = settings.sendEmailConfirmation === true;

      if (sendEmailConfirmation && data && data.patient.email) {
        const startAt = data.appointment.startAt instanceof Date
          ? data.appointment.startAt
          : new Date(data.appointment.startAt);
        const startFormatted = formatInBuenosAires(mysqlDateToUTC(startAt), "dd/MM/yyyy HH:mm");
        const profesionalName = data.professional?.name ?? "el profesional";
        const pacienteContent = getTurnoConfirmadoPacienteContent({
          profesional: profesionalName,
          fechaHora: startFormatted,
          sede: data.location.name,
          sedeAddress: formatLocationAddress(data.location),
        });
        await sendMail({
          to: data.patient.email,
          subject: "Turno confirmado",
          text: pacienteContent.text,
          html: renderBasicTemplate({
            title: "Turno confirmado",
            preview: pacienteContent.preview,
            body: pacienteContent.bodyHtml,
          }),
        });
      }
    } catch (error) {
      console.error("Error sending confirmation email:", error);
    }
  }

  return NextResponse.json(updated);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await findAppointmentWithRelations(id, tenantId);

  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check permissions
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL" && data.appointment.patientId !== session.userId && data.appointment.professionalId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const appointment = await findAppointmentById(id, tenantId);
  if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteAppointment(id, tenantId);
  return NextResponse.json({ success: true });
}

