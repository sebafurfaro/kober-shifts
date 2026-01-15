-- Migración: agregar campos adicionales para pacientes
USE kober_shifts;

ALTER TABLE users
  ADD COLUMN firstName VARCHAR(255) NULL AFTER name,
  ADD COLUMN lastName VARCHAR(255) NULL AFTER firstName,
  ADD COLUMN phone VARCHAR(50) NULL,
  ADD COLUMN address TEXT NULL,
  ADD COLUMN dateOfBirth DATE NULL,
  ADD COLUMN admissionDate DATE NULL,
  ADD COLUMN gender ENUM('Masculino', 'Femenino', 'No binario') NULL,
  ADD COLUMN nationality VARCHAR(100) NULL;

