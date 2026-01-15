-- Migración: agregar campos de cancelación a appointments
USE kober_shifts;

ALTER TABLE appointments
  ADD COLUMN cancellationReason TEXT NULL,
  ADD COLUMN cancelledBy ENUM('PATIENT', 'PROFESSIONAL', 'ADMIN') NULL;

