import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { Role } from "@/lib/types";
import { upsertLocalPaymentStatus, ensurePaymentsTable } from "@/lib/mercadopago-payments";
import { updateAppointment, findAppointmentById } from "@/lib/db";
import { AppointmentStatus } from "@/lib/types";
import mysql from "@/lib/mysql";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string; appointmentId: string }> }
) {
  const { tenantId, appointmentId } = await params;
  const session = await getSession();
  
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    session.role !== Role.ADMIN &&
    session.role !== Role.PROFESSIONAL &&
    session.role !== Role.SUPERVISOR
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await ensurePaymentsTable();

    const computedStatusExpr = `
      CASE 
        WHEN mp.status = 'fully_paid' THEN 'Pagado'
        WHEN mp.status = 'approved' AND COALESCE(s.seniaPercent, 0) > 0 AND COALESCE(s.seniaPercent, 0) < 100 THEN 'Seña paga'
        WHEN mp.status = 'approved' THEN 'Pagado'
        ELSE 'Pendiente'
      END
    `;

    const [rows] = await mysql.execute(
      `SELECT 
          a.id as appointmentId,
          a.startAt as appointmentDate,
          COALESCE(s.name, 'Sin servicio') as serviceName,
          COALESCE(s.price, 0) as servicePrice,
          COALESCE(s.seniaPercent, 0) as seniaPercent,
          COALESCE(p.name, CONCAT(a.patientFirstName, ' ', a.patientLastName)) as patientName,
          p.phone as patientPhone,
          p.email as patientEmail,
          mp.amount as mpAmount,
          mp.status as rawMpStatus,
          (${computedStatusExpr}) as computedPaymentStatus
      FROM appointments a
      LEFT JOIN services s ON a.serviceId = s.id AND a.tenantId = s.tenantId
      LEFT JOIN users p ON a.patientId = p.id AND a.tenantId = p.tenantId
      LEFT JOIN mercadopago_payments mp ON BINARY mp.appointmentId = BINARY a.id AND BINARY mp.tenantId = BINARY a.tenantId
      WHERE a.id = ? AND a.tenantId = ?
        AND (
          (s.id IS NOT NULL AND COALESCE(s.price, 0) > 0)
          OR a.status = 'PENDING_DEPOSIT'
          OR EXISTS (
            SELECT 1 FROM mercadopago_payments mp4
            WHERE BINARY mp4.appointmentId = BINARY a.id AND BINARY mp4.tenantId = BINARY a.tenantId AND mp4.status = 'pending'
          )
        )`,
      [appointmentId, tenantId]
    );

    const data = (rows as any[])[0];
    if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching payment details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tenantId: string; appointmentId: string }> }
) {
  const { tenantId, appointmentId } = await params;
  const session = await getSession();
  
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    session.role !== Role.ADMIN &&
    session.role !== Role.PROFESSIONAL &&
    session.role !== Role.SUPERVISOR
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { status, amount } = await req.json();

    if (!status || typeof amount !== "number") {
      return NextResponse.json({ error: "Bad Request: status and amount required" }, { status: 400 });
    }

    // Actualizar el registro del pago manualmente ("fully_paid", "pending", "approved")
    await upsertLocalPaymentStatus(tenantId, appointmentId, status, amount);

    // Si se marcó como totalmente pagado o aprobado de forma manual (Seña Paga),
    // asegurar que el turno esté CONFIRMED si venía PENDING_DEPOSIT
    if (status === "fully_paid" || status === "approved") {
      const apt = await findAppointmentById(appointmentId, tenantId);
      if (apt && apt.status === AppointmentStatus.PENDING_DEPOSIT) {
        await updateAppointment({
          id: appointmentId,
          tenantId,
          status: AppointmentStatus.CONFIRMED,
        });
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error("Error updating manual payment status:", error);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}
