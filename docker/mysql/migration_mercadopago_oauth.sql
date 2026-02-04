-- Migration: MercadoPago OAuth accounts per tenant + PENDING_DEPOSIT status
USE kober_shifts;

-- Add PENDING_DEPOSIT to appointments status
ALTER TABLE appointments
  MODIFY COLUMN status ENUM('REQUESTED', 'PENDING_DEPOSIT', 'CONFIRMED', 'CANCELLED', 'ATTENDED') NOT NULL DEFAULT 'REQUESTED';

-- Table: mercadopago_accounts (tokens per tenant, encrypted at rest)
CREATE TABLE IF NOT EXISTS mercadopago_accounts (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(255) NOT NULL,
  mpUserId VARCHAR(255),
  accessTokenEncrypted TEXT NOT NULL,
  refreshTokenEncrypted TEXT NOT NULL,
  expiresAt DATETIME,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_mercadopago_accounts_tenant (tenantId),
  INDEX idx_mercadopago_tenant (tenantId),
  INDEX idx_mercadopago_mp_user (mpUserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
