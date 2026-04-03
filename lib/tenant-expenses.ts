import mysql from "./mysql";
import { randomUUID } from "crypto";

export interface TenantExpenseRow {
  id: string;
  tenantId: string;
  title: string;
  category: string;
  description: string | null;
  amount: number;
  expenseDate: string;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function ensureTenantExpensesTable(): Promise<void> {
  await mysql.execute(`
    CREATE TABLE IF NOT EXISTS tenant_expenses (
      id VARCHAR(36) PRIMARY KEY,
      tenantId VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT NULL,
      amount DECIMAL(12,2) NOT NULL,
      expenseDate DATE NOT NULL,
      isRecurring TINYINT(1) NOT NULL DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tenant_expenses_tenant (tenantId),
      INDEX idx_tenant_expenses_date (tenantId, expenseDate),
      INDEX idx_tenant_expenses_category (tenantId, category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

function rowToExpense(row: Record<string, unknown>): TenantExpenseRow {
  return {
    id: String(row.id),
    tenantId: String(row.tenantId),
    title: String(row.title),
    category: String(row.category),
    description: row.description != null ? String(row.description) : null,
    amount: Number(row.amount),
    expenseDate:
      row.expenseDate instanceof Date
        ? row.expenseDate.toISOString().slice(0, 10)
        : String(row.expenseDate).slice(0, 10),
    isRecurring: Boolean(row.isRecurring),
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt)),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(String(row.updatedAt)),
  };
}

export async function listTenantExpenses(
  tenantId: string,
  filters: { search?: string; date?: string; category?: string }
): Promise<TenantExpenseRow[]> {
  await ensureTenantExpensesTable();
  let sql = `SELECT * FROM tenant_expenses WHERE tenantId = ?`;
  const params: unknown[] = [tenantId];

  if (filters.search?.trim()) {
    const like = `%${filters.search.trim()}%`;
    sql += ` AND (title LIKE ? OR description LIKE ? OR category LIKE ?)`;
    params.push(like, like, like);
  }
  if (filters.date?.trim()) {
    sql += ` AND expenseDate = ?`;
    params.push(filters.date.trim());
  }
  if (filters.category?.trim()) {
    sql += ` AND category = ?`;
    params.push(filters.category.trim());
  }

  sql += ` ORDER BY expenseDate DESC, createdAt DESC`;

  const [rows] = await mysql.execute(sql, params);
  return (rows as Record<string, unknown>[]).map(rowToExpense);
}

export async function createTenantExpense(input: {
  tenantId: string;
  title: string;
  category: string;
  description: string | null;
  amount: number;
  expenseDate: string;
  isRecurring: boolean;
}): Promise<TenantExpenseRow> {
  await ensureTenantExpensesTable();
  const id = randomUUID();
  await mysql.execute(
    `INSERT INTO tenant_expenses
      (id, tenantId, title, category, description, amount, expenseDate, isRecurring)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.tenantId,
      input.title,
      input.category,
      input.description,
      input.amount,
      input.expenseDate.slice(0, 10),
      input.isRecurring ? 1 : 0,
    ]
  );
  const [rows] = await mysql.execute(`SELECT * FROM tenant_expenses WHERE id = ?`, [id]);
  const row = (rows as Record<string, unknown>[])[0];
  if (!row) throw new Error("Failed to load created expense");
  return rowToExpense(row);
}

export async function updateTenantExpense(
  tenantId: string,
  id: string,
  input: {
    title: string;
    category: string;
    description: string | null;
    amount: number;
    expenseDate: string;
    isRecurring: boolean;
  }
): Promise<TenantExpenseRow | null> {
  await ensureTenantExpensesTable();
  const [res] = await mysql.execute(
    `UPDATE tenant_expenses SET
      title = ?, category = ?, description = ?, amount = ?, expenseDate = ?, isRecurring = ?
     WHERE id = ? AND tenantId = ?`,
    [
      input.title,
      input.category,
      input.description,
      input.amount,
      input.expenseDate.slice(0, 10),
      input.isRecurring ? 1 : 0,
      id,
      tenantId,
    ]
  );
  const affected = (res as { affectedRows?: number }).affectedRows ?? 0;
  if (affected === 0) return null;
  const [rows] = await mysql.execute(`SELECT * FROM tenant_expenses WHERE id = ? AND tenantId = ?`, [
    id,
    tenantId,
  ]);
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToExpense(row) : null;
}

export async function deleteTenantExpense(tenantId: string, id: string): Promise<boolean> {
  await ensureTenantExpensesTable();
  const [res] = await mysql.execute(`DELETE FROM tenant_expenses WHERE id = ? AND tenantId = ?`, [
    id,
    tenantId,
  ]);
  const affected = (res as { affectedRows?: number }).affectedRows ?? 0;
  return affected > 0;
}
