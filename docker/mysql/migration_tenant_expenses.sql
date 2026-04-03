-- Egresos del comercio (variable y recurrente). Ejecutar en Railway / local si la tabla no existe.

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
