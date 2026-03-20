-- Agrega columnas JSON para datos dinámicos del perfil de paciente
ALTER TABLE users
  ADD COLUMN additionalInfo JSON DEFAULT NULL,
  ADD COLUMN archives JSON DEFAULT NULL,
  ADD COLUMN notes JSON DEFAULT NULL;
