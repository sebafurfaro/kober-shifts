-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logoUrl VARCHAR(255),
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create default tenant
INSERT IGNORE INTO tenants (id, name) VALUES ('default', 'Default Tenant');

-- Add tenantId column to existing tables
ALTER TABLE users ADD COLUMN tenantId VARCHAR(255) NOT NULL DEFAULT 'default' AFTER id;
ALTER TABLE specialties ADD COLUMN tenantId VARCHAR(255) NOT NULL DEFAULT 'default' AFTER id;
ALTER TABLE locations ADD COLUMN tenantId VARCHAR(255) NOT NULL DEFAULT 'default' AFTER id;
ALTER TABLE professional_profiles ADD COLUMN tenantId VARCHAR(255) NOT NULL DEFAULT 'default' AFTER userId;
ALTER TABLE appointments ADD COLUMN tenantId VARCHAR(255) NOT NULL DEFAULT 'default' AFTER id;
ALTER TABLE google_oauth_tokens ADD COLUMN tenantId VARCHAR(255) NOT NULL DEFAULT 'default' AFTER id;
ALTER TABLE medical_coverages ADD COLUMN tenantId VARCHAR(255) NOT NULL DEFAULT 'default' AFTER id;
ALTER TABLE medical_plans ADD COLUMN tenantId VARCHAR(255) NOT NULL DEFAULT 'default' AFTER id;

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE specialties ADD CONSTRAINT fk_specialties_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE locations ADD CONSTRAINT fk_locations_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE professional_profiles ADD CONSTRAINT fk_professional_profiles_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE google_oauth_tokens ADD CONSTRAINT fk_google_oauth_tokens_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE medical_coverages ADD CONSTRAINT fk_medical_coverages_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE medical_plans ADD CONSTRAINT fk_medical_plans_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;

-- Update indexes
CREATE INDEX idx_users_tenant ON users(tenantId);
CREATE INDEX idx_specialties_tenant ON specialties(tenantId);
CREATE INDEX idx_locations_tenant ON locations(tenantId);
CREATE INDEX idx_appointments_tenant ON appointments(tenantId);
