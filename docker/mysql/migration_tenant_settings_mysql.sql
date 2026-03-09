-- Migración: datos que estaban en MongoDB (tenant_settings, tenant_payments, tenant_features)
-- a MySQL para poder retirar MongoDB de la infraestructura.

USE kober_shifts;

-- Configuración por tenant (admin settings, labels, permisos)
CREATE TABLE IF NOT EXISTS tenant_settings (
  tenantId VARCHAR(255) PRIMARY KEY,
  settings JSON,
  permissions JSON,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuración de pagos por tenant (bank, mercadoPago, paymentConfig)
CREATE TABLE IF NOT EXISTS tenant_payments (
  tenantId VARCHAR(255) PRIMARY KEY,
  settings JSON,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Features y límites por tenant (Store Manager)
CREATE TABLE IF NOT EXISTS tenant_features (
  tenantId VARCHAR(255) PRIMARY KEY,
  features JSON,
  limits JSON,
  usage JSON,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
