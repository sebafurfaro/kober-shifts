-- Migration to add licenseNumber, medicalCoverages, and availabilityConfig to professional_profiles
USE kober_shifts;

ALTER TABLE professional_profiles 
ADD COLUMN IF NOT EXISTS licenseNumber VARCHAR(100) AFTER color,
ADD COLUMN IF NOT EXISTS medicalCoverages JSON AFTER licenseNumber,
ADD COLUMN IF NOT EXISTS availabilityConfig JSON AFTER medicalCoverages;
