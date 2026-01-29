-- Migration: Add detailed address fields to locations table
-- Date: 2026-01-23

USE kober_shifts;

-- Add new address fields to locations table
ALTER TABLE locations 
  ADD COLUMN street VARCHAR(255) NULL AFTER address,
  ADD COLUMN streetNumber VARCHAR(50) NULL AFTER street,
  ADD COLUMN floor VARCHAR(50) NULL AFTER streetNumber,
  ADD COLUMN apartment VARCHAR(50) NULL AFTER floor,
  ADD COLUMN postalCode VARCHAR(20) NULL AFTER apartment,
  ADD COLUMN country VARCHAR(100) NULL AFTER postalCode,
  ADD COLUMN province VARCHAR(100) NULL AFTER country,
  ADD COLUMN neighborhood VARCHAR(100) NULL AFTER province;

-- All new fields are nullable to maintain backward compatibility with existing data
