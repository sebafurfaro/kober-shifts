-- Add PENDING_DEPOSIT to appointments.status ENUM (required for Mercado Pago flow).
-- Run once: mysql -u root -p kober_shifts < docker/mysql/migration_appointments_pending_deposit.sql
USE kober_shifts;

ALTER TABLE appointments
  MODIFY COLUMN status ENUM('REQUESTED', 'PENDING_DEPOSIT', 'CONFIRMED', 'CANCELLED', 'ATTENDED') NOT NULL DEFAULT 'REQUESTED';
