import mysql from "./mysql";
import { randomUUID } from "crypto";

export interface MercadoPagoPayment {
  id: string;
  tenantId: string;
  appointmentId: string;
  mpPaymentId: string | null;
  mpPreferenceId: string | null;
  amount: number;
  status: "pending" | "approved" | "rejected" | string;
  createdAt: Date;
  updatedAt: Date;
}

export async function ensurePaymentsTable() {
  await mysql.execute(`
    CREATE TABLE IF NOT EXISTS mercadopago_payments (
      id VARCHAR(36) PRIMARY KEY,
      tenantId VARCHAR(255) NOT NULL,
      appointmentId VARCHAR(36) NOT NULL,
      mpPaymentId VARCHAR(255) NULL,
      mpPreferenceId VARCHAR(255) NULL,
      amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_mp_payments_tenant (tenantId),
      INDEX idx_mp_payments_appointment (appointmentId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

function rowToPayment(row: any): MercadoPagoPayment {
  return {
    id: row.id,
    tenantId: row.tenantId,
    appointmentId: row.appointmentId,
    mpPaymentId: row.mpPaymentId ?? null,
    mpPreferenceId: row.mpPreferenceId ?? null,
    amount: Number(row.amount),
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createLocalPaymentRecord(params: {
  tenantId: string;
  appointmentId: string;
  amount: number;
  mpPreferenceId?: string;
}): Promise<MercadoPagoPayment> {
  await ensurePaymentsTable();
  const id = randomUUID();
  await mysql.execute(
    `INSERT INTO mercadopago_payments 
     (id, tenantId, appointmentId, amount, status, mpPreferenceId) 
     VALUES (?, ?, ?, ?, 'pending', ?)`,
    [id, params.tenantId, params.appointmentId, params.amount, params.mpPreferenceId ?? null]
  );
  const [rows] = await mysql.execute("SELECT * FROM mercadopago_payments WHERE id = ?", [id]);
  return rowToPayment((rows as any[])[0]);
}

export async function markLocalPaymentAsApproved(
  appointmentId: string,
  mpPaymentId: string
): Promise<void> {
  await ensurePaymentsTable();
  await mysql.execute(
    `UPDATE mercadopago_payments 
     SET status = 'approved', mpPaymentId = ?
     WHERE appointmentId = ? AND status = 'pending'`,
    [mpPaymentId, appointmentId]
  );
}

// Para otros estados (rejected, etc)
export async function updateLocalPaymentStatusByPreferenceOrAppointment(
  appointmentId: string,
  mpPaymentId: string,
  status: string
): Promise<void> {
  await ensurePaymentsTable();
  await mysql.execute(
    `UPDATE mercadopago_payments 
     SET status = ?, mpPaymentId = ?
     WHERE appointmentId = ?`,
    [status, mpPaymentId, appointmentId]
  );
}
// Para overrides manuales (en efectivo/qr no conectado)
export async function upsertLocalPaymentStatus(
  tenantId: string,
  appointmentId: string,
  status: string,
  amount: number
): Promise<void> {
  await ensurePaymentsTable();
  const [rows] = await mysql.execute("SELECT id FROM mercadopago_payments WHERE appointmentId = ? AND tenantId = ?", [appointmentId, tenantId]);
  const exists = (rows as any[]).length > 0;
  
  if (exists) {
    await mysql.execute(
      `UPDATE mercadopago_payments SET status = ? WHERE appointmentId = ? AND tenantId = ?`,
      [status, appointmentId, tenantId]
    );
  } else {
    const id = randomUUID();
    await mysql.execute(
      `INSERT INTO mercadopago_payments 
       (id, tenantId, appointmentId, amount, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, tenantId, appointmentId, amount, status]
    );
  }
}
