import mysql from './mysql';
import type { User, Specialty, Service, Location, ProfessionalProfile, GoogleOAuthToken, Appointment, Role, AppointmentStatus, MedicalCoverage, MedicalPlan, MedicalCoverageWithPlans, Tenant } from './types';
import { isSupportAdminEmail } from './constants';

// Helper para convertir filas de MySQL a objetos tipados
function rowToUser(row: any): User {
  return {
    id: row.id,
    tenantId: row.tenantId,
    email: row.email,
    name: row.name,
    firstName: row.firstName || null,
    lastName: row.lastName || null,
    phone: row.phone || null,
    address: row.address || null,
    dni: row.dni !== undefined ? (row.dni || null) : null,
    coverage: row.coverage !== undefined ? (row.coverage || null) : null,
    plan: row.plan !== undefined ? (row.plan || null) : null,
    dateOfBirth: row.dateOfBirth || null,
    admissionDate: row.admissionDate || null,
    gender: row.gender || null,
    nationality: row.nationality || null,
    googleId: row.googleId || null,
    passwordHash: row.passwordHash,
    role: row.role as Role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToSpecialty(row: any): Specialty {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToService(row: any): Service {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    description: row.description ?? null,
    durationMinutes: Number(row.durationMinutes ?? 0),
    marginMinutes: Number(row.marginMinutes ?? 0),
    price: Number(row.price ?? 0),
    seniaPercent: Number(row.seniaPercent ?? 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToLocation(row: any): Location {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    address: row.address,
    street: row.street !== undefined ? (row.street || null) : null,
    streetNumber: row.streetNumber !== undefined ? (row.streetNumber || null) : null,
    floor: row.floor !== undefined ? (row.floor || null) : null,
    apartment: row.apartment !== undefined ? (row.apartment || null) : null,
    postalCode: row.postalCode !== undefined ? (row.postalCode || null) : null,
    country: row.country !== undefined ? (row.country || null) : null,
    province: row.province !== undefined ? (row.province || null) : null,
    neighborhood: row.neighborhood !== undefined ? (row.neighborhood || null) : null,
    phone: row.phone,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToProfessionalProfile(row: any): ProfessionalProfile {
  // Parse availableDays from JSON
  let availableDays: number[] | null = null;
  if (row.availableDays) {
    try {
      const parsed = typeof row.availableDays === 'string' ? JSON.parse(row.availableDays) : row.availableDays;
      availableDays = Array.isArray(parsed) ? parsed : null;
    } catch {
      availableDays = null;
    }
  }

  // Parse availableHours from JSON
  let availableHours: { start: string; end: string } | null = null;
  if (row.availableHours) {
    try {
      const parsed = typeof row.availableHours === 'string' ? JSON.parse(row.availableHours) : row.availableHours;
      if (parsed && typeof parsed === 'object' && parsed.start && parsed.end) {
        availableHours = { start: parsed.start, end: parsed.end };
      }
    } catch {
      availableHours = null;
    }
  }

  return {
    userId: row.userId,
    tenantId: row.tenantId,
    specialtyId: row.specialtyId,
    isActive: Boolean(row.isActive),
    googleCalendarId: row.googleCalendarId,
    color: (row.color && typeof row.color === 'string' && row.color.trim() !== '') ? row.color.trim() : null,
    licenseNumber: row.licenseNumber || null,
    medicalCoverages: (() => {
      if (!row.medicalCoverages) return null;
      try {
        return typeof row.medicalCoverages === 'string' ? JSON.parse(row.medicalCoverages) : row.medicalCoverages;
      } catch (e) {
        console.error("Error parsing medicalCoverages:", e);
        return null;
      }
    })(),
    availabilityConfig: (() => {
      if (!row.availabilityConfig) return null;
      try {
        const parsed = typeof row.availabilityConfig === 'string' ? JSON.parse(row.availabilityConfig) : row.availabilityConfig;
        if (!parsed || typeof parsed !== 'object' || !parsed.days) return null;
        
        // Normalize day keys to numbers (JSON parsing may convert them to strings)
        const normalizedDays: { [key: number]: any } = {};
        for (const key in parsed.days) {
          const numKey = Number(key);
          if (!isNaN(numKey) && numKey >= 0 && numKey <= 6) {
            normalizedDays[numKey] = parsed.days[key];
          }
        }
        
        return {
          days: normalizedDays
        };
      } catch (e) {
        console.error("Error parsing availabilityConfig:", e);
        return null;
      }
    })(),
    availableDays,
    availableHours,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToGoogleOAuthToken(row: any): GoogleOAuthToken {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    accessToken: row.accessToken,
    refreshToken: row.refreshToken,
    scope: row.scope,
    tokenType: row.tokenType,
    expiryDate: row.expiryDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToAppointment(row: any): Appointment {
  return {
    id: row.id,
    tenantId: row.tenantId,
    status: row.status as AppointmentStatus,
    startAt: row.startAt,
    endAt: row.endAt,
    patientId: row.patientId,
    professionalId: row.professionalId,
    locationId: row.locationId,
    specialtyId: row.specialtyId,
    googleEventId: row.googleEventId,
    notes: row.notes,
    cancellationReason: row.cancellationReason || null,
    cancelledBy: row.cancelledBy || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// User operations
export async function findUserById(id: string, tenantId?: string): Promise<User | null> {
  let query = 'SELECT * FROM users WHERE id = ?';
  const params = [id];
  if (tenantId) {
    query += ' AND tenantId = ?';
    params.push(tenantId);
  }
  const [rows] = await mysql.execute(query, params);
  const result = rows as any[];
  return result.length > 0 ? rowToUser(result[0]) : null;
}

export async function deleteUser(id: string, tenantId: string): Promise<void> {
  await mysql.execute('DELETE FROM users WHERE id = ? AND tenantId = ?', [id, tenantId]);
}

export async function findUserByEmail(email: string, tenantId: string): Promise<User | null> {
  const [rows] = await mysql.execute('SELECT * FROM users WHERE email = ? AND tenantId = ?', [email, tenantId]);
  const result = rows as any[];
  return result.length > 0 ? rowToUser(result[0]) : null;
}

// Find user by email across all tenants (for store authentication)
export async function findUserByEmailAnyTenant(email: string): Promise<User | null> {
  const [rows] = await mysql.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  const result = rows as any[];
  return result.length > 0 ? rowToUser(result[0]) : null;
}

export async function findUserByGoogleId(googleId: string, tenantId: string): Promise<User | null> {
  const [rows] = await mysql.execute('SELECT * FROM users WHERE googleId = ? AND tenantId = ?', [googleId, tenantId]);
  const result = rows as any[];
  return result.length > 0 ? rowToUser(result[0]) : null;
}

export async function createUser(data: {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
  dni?: string | null;
  coverage?: string | null;
  plan?: string | null;
  dateOfBirth?: Date | null;
  admissionDate?: Date | null;
  gender?: string | null;
  nationality?: string | null;
  googleId?: string | null;
  passwordHash: string;
  role: Role;
  tenantId: string;
}): Promise<User> {
  // Try with all fields first (if migration has been run)
  try {
    await mysql.execute(
      'INSERT INTO users (id, tenantId, email, name, firstName, lastName, phone, address, dni, coverage, plan, dateOfBirth, admissionDate, gender, nationality, googleId, passwordHash, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.id,
        data.tenantId,
        data.email,
        data.name,
        data.firstName || null,
        data.lastName || null,
        data.phone || null,
        data.address || null,
        data.dni || null,
        data.coverage || null,
        data.plan || null,
        data.dateOfBirth || null,
        data.admissionDate || null,
        data.gender || null,
        data.nationality || null,
        data.googleId || null,
        data.passwordHash,
        data.role,
      ]
    );
  } catch (error: any) {
    // If new columns don't exist, fallback to basic fields only
    if (error?.code === 'ER_BAD_FIELD_ERROR') {
      await mysql.execute(
        'INSERT INTO users (id, tenantId, email, name, firstName, lastName, phone, address, dateOfBirth, admissionDate, gender, nationality, googleId, passwordHash, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          data.id,
          data.tenantId,
          data.email,
          data.name,
          data.firstName || null,
          data.lastName || null,
          data.phone || null,
          data.address || null,
          data.dateOfBirth || null,
          data.admissionDate || null,
          data.gender || null,
          data.nationality || null,
          data.googleId || null,
          data.passwordHash,
          data.role,
        ]
      );
    } else {
      throw error;
    }
  }
  const user = await findUserById(data.id, data.tenantId);
  if (!user) throw new Error('Failed to create user');
  return user;
}

export async function updateUser(
  id: string,
  tenantId: string,
  data: Partial<Pick<User, 'name' | 'firstName' | 'lastName' | 'email' | 'phone' | 'address' | 'dni' | 'coverage' | 'plan' | 'dateOfBirth' | 'admissionDate' | 'gender' | 'nationality' | 'googleId' | 'passwordHash' | 'role'>>
): Promise<User> {
  const updates: string[] = [];
  const values: any[] = [];
  const newFieldUpdates: string[] = [];
  const newFieldValues: any[] = [];

  // Basic fields (always available)
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.firstName !== undefined) {
    updates.push('firstName = ?');
    values.push(data.firstName);
  }
  if (data.lastName !== undefined) {
    updates.push('lastName = ?');
    values.push(data.lastName);
  }
  if (data.email !== undefined) {
    updates.push('email = ?');
    values.push(data.email);
  }
  if (data.phone !== undefined) {
    updates.push('phone = ?');
    values.push(data.phone);
  }
  if (data.address !== undefined) {
    updates.push('address = ?');
    values.push(data.address);
  }
  if (data.dateOfBirth !== undefined) {
    updates.push('dateOfBirth = ?');
    values.push(data.dateOfBirth);
  }
  if (data.admissionDate !== undefined) {
    updates.push('admissionDate = ?');
    values.push(data.admissionDate);
  }
  if (data.gender !== undefined) {
    updates.push('gender = ?');
    values.push(data.gender);
  }
  if (data.nationality !== undefined) {
    updates.push('nationality = ?');
    values.push(data.nationality);
  }
  if (data.passwordHash !== undefined) {
    updates.push('passwordHash = ?');
    values.push(data.passwordHash);
  }
  if (data.role !== undefined) {
    // Solo seba.furfaro@gmail.com puede tener rol ADMIN (soporte).
    if (data.role === "ADMIN") {
      const existingUser = await findUserById(id, tenantId);
      if (existingUser && isSupportAdminEmail(existingUser.email)) {
        updates.push("role = ?");
        values.push(data.role);
      }
      // Si no es support admin, no actualizar role (no agregar a updates)
    } else {
      updates.push("role = ?");
      values.push(data.role);
    }
  }
  if (data.googleId !== undefined) {
    updates.push('googleId = ?');
    values.push(data.googleId);
  }

  // New fields (may not exist yet)
  if (data.dni !== undefined) {
    newFieldUpdates.push('dni = ?');
    newFieldValues.push(data.dni);
  }
  if (data.coverage !== undefined) {
    newFieldUpdates.push('coverage = ?');
    newFieldValues.push(data.coverage);
  }
  if (data.plan !== undefined) {
    newFieldUpdates.push('plan = ?');
    newFieldValues.push(data.plan);
  }

  if (updates.length === 0 && newFieldUpdates.length === 0) {
    const user = await findUserById(id, tenantId);
    if (!user) throw new Error('User not found');
    return user;
  }

  // Try to update with all fields first
  const allUpdates = [...updates, ...newFieldUpdates];
  const allValues = [...values, ...newFieldValues, id, tenantId];
  
  try {
    await mysql.execute(`UPDATE users SET ${allUpdates.join(', ')} WHERE id = ? AND tenantId = ?`, allValues);
  } catch (error: any) {
    // If new columns don't exist, only update basic fields
    if (error?.code === 'ER_BAD_FIELD_ERROR' && updates.length > 0) {
      const basicValues = [...values, id, tenantId];
      await mysql.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ? AND tenantId = ?`, basicValues);
    } else {
      throw error;
    }
  }
  
  const user = await findUserById(id, tenantId);
  if (!user) throw new Error('Failed to update user');
  return user;
}

export async function linkGoogleAccount(userId: string, tenantId: string, googleId: string): Promise<void> {
  await mysql.execute('UPDATE users SET googleId = ? WHERE id = ? AND tenantId = ?', [googleId, userId, tenantId]);
}

export async function findUsersByRole(role: Role, tenantId: string): Promise<User[]> {
  const [rows] = await mysql.execute('SELECT * FROM users WHERE role = ? AND tenantId = ?', [role, tenantId]);
  return (rows as any[]).map(rowToUser);
}

export async function findAllUsers(): Promise<User[]> {
  const [rows] = await mysql.execute('SELECT * FROM users ORDER BY createdAt DESC');
  return (rows as any[]).map(rowToUser);
}

/** Cuenta profesionales del tenant que cuentan para el límite (excluye al usuario de soporte seba.furfaro@gmail.com). */
export async function countProfessionals(tenantId: string): Promise<number> {
  const { SUPPORT_ADMIN_EMAIL } = await import("./constants");
  const [rows] = await mysql.execute(
    "SELECT COUNT(*) as count FROM users WHERE role = 'PROFESSIONAL' AND tenantId = ? AND (email IS NULL OR LOWER(TRIM(email)) != ?)",
    [tenantId, SUPPORT_ADMIN_EMAIL.toLowerCase()]
  );
  const result = rows as { count: number }[];
  return result.length > 0 ? Number(result[0].count) : 0;
}

export async function findUsersWithProfessionalProfile(tenantId: string): Promise<(User & { professional: (ProfessionalProfile & { specialty: Specialty | null; specialties: Specialty[] }) | null })[]> {
  // First get all professionals with their profiles
  const [profileRows] = await mysql.execute(
    `SELECT 
      u.*,
      pp.userId as pp_userId,
      pp.tenantId as pp_tenantId,
      pp.specialtyId as pp_specialtyId,
      pp.isActive as pp_isActive,
      pp.googleCalendarId as pp_googleCalendarId,
      pp.color as pp_color,
      pp.licenseNumber as pp_licenseNumber,
      pp.medicalCoverages as pp_medicalCoverages,
      pp.availabilityConfig as pp_availabilityConfig,
      pp.availableDays as pp_availableDays,
      pp.availableHours as pp_availableHours,
      pp.createdAt as pp_createdAt,
      pp.updatedAt as pp_updatedAt
    FROM users u
    LEFT JOIN professional_profiles pp ON u.id = pp.userId AND u.tenantId = pp.tenantId
    WHERE u.role = 'PROFESSIONAL' AND u.tenantId = ?
    ORDER BY u.createdAt DESC`,
    [tenantId]
  );

  // Then get all specialties for each professional from the many-to-many table
  // Use LEFT JOIN in case the table doesn't exist yet or has no data
  let specialtyRows: any[] = [];
  try {
    const [rows] = await mysql.execute(
      `SELECT 
        ps.userId,
        s.id as s_id,
        s.tenantId as s_tenantId,
        s.name as s_name,
        s.createdAt as s_createdAt,
        s.updatedAt as s_updatedAt
      FROM professional_specialties ps
      INNER JOIN specialties s ON ps.specialtyId = s.id
      WHERE s.tenantId = ?
      ORDER BY ps.userId, s.name`,
      [tenantId]
    );
    specialtyRows = rows as any[];
  } catch (error: any) {
    // If table doesn't exist, continue without specialties from many-to-many table
    // Will fall back to single specialty from professional_profiles
    if (error.code !== 'ER_NO_SUCH_TABLE') {
      throw error;
    }
  }

  const profileResult = profileRows as any[];
  const specialtyResult = specialtyRows as any[];

  // Group specialties by userId
  const specialtiesByUser = new Map<string, Specialty[]>();
  for (const row of specialtyResult) {
    if (!specialtiesByUser.has(row.userId)) {
      specialtiesByUser.set(row.userId, []);
    }
    specialtiesByUser.get(row.userId)!.push(rowToSpecialty({
      id: row.s_id,
      tenantId: row.s_tenantId,
      name: row.s_name,
      createdAt: row.s_createdAt,
      updatedAt: row.s_updatedAt,
    }));
  }

  // Build result with specialties
  const userMap = new Map<string, User & { professional: (ProfessionalProfile & { specialty: Specialty | null; specialties: Specialty[] }) | null }>();

  for (const row of profileResult) {
    if (!userMap.has(row.id)) {
      const userSpecialties = specialtiesByUser.get(row.id) || [];
      const primarySpecialty = userSpecialties.length > 0 ? userSpecialties[0] : null;

      userMap.set(row.id, {
        ...rowToUser(row),
        professional: row.pp_userId ? {
          ...rowToProfessionalProfile({
            userId: row.pp_userId,
            tenantId: row.pp_tenantId,
            specialtyId: row.pp_specialtyId || (primarySpecialty?.id || ''),
            isActive: row.pp_isActive,
            googleCalendarId: row.pp_googleCalendarId,
            color: (row.pp_color && row.pp_color.trim() !== '') ? row.pp_color.trim() : null,
            licenseNumber: row.pp_licenseNumber,
            medicalCoverages: row.pp_medicalCoverages,
            availabilityConfig: row.pp_availabilityConfig,
            availableDays: row.pp_availableDays,
            availableHours: row.pp_availableHours,
            createdAt: row.pp_createdAt,
            updatedAt: row.pp_updatedAt,
          }),
          specialty: primarySpecialty,
          specialties: userSpecialties,
        } : null,
      });
    }
  }

  return Array.from(userMap.values());
}

// Specialty operations
export async function findSpecialtyById(id: string, tenantId: string): Promise<Specialty | null> {
  const [rows] = await mysql.execute('SELECT * FROM specialties WHERE id = ? AND tenantId = ?', [id, tenantId]);
  const result = rows as any[];
  return result.length > 0 ? rowToSpecialty(result[0]) : null;
}

export async function deleteSpecialty(id: string, tenantId: string): Promise<void> {
  await mysql.execute('DELETE FROM specialties WHERE id = ? AND tenantId = ?', [id, tenantId]);
}

export async function findAllSpecialties(tenantId: string): Promise<Specialty[]> {
  const [rows] = await mysql.execute('SELECT * FROM specialties WHERE tenantId = ? ORDER BY name ASC', [tenantId]);
  return (rows as any[]).map(rowToSpecialty);
}

export async function updateSpecialty(id: string, tenantId: string, data: Partial<Pick<Specialty, 'name'>>): Promise<Specialty> {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }

  if (updates.length === 0) {
    const specialty = await findSpecialtyById(id, tenantId);
    if (!specialty) throw new Error('Specialty not found');
    return specialty;
  }

  values.push(id, tenantId);
  await mysql.execute(`UPDATE specialties SET ${updates.join(', ')} WHERE id = ? AND tenantId = ?`, values);
  const specialty = await findSpecialtyById(id, tenantId);
  if (!specialty) throw new Error('Failed to update specialty');
  return specialty;
}

export async function countProfessionalsBySpecialty(specialtyId: string, tenantId: string): Promise<number> {
  const [rows] = await mysql.execute(
    'SELECT COUNT(*) as count FROM professional_profiles WHERE specialtyId = ? AND tenantId = ?',
    [specialtyId, tenantId]
  );
  const result = rows as any[];
  return result.length > 0 ? Number(result[0].count) : 0;
}

export async function createSpecialty(data: { id: string; tenantId: string; name: string }): Promise<Specialty> {
  await mysql.execute('INSERT INTO specialties (id, tenantId, name) VALUES (?, ?, ?)', [data.id, data.tenantId, data.name]);
  const specialty = await findSpecialtyById(data.id, data.tenantId);
  if (!specialty) throw new Error('Failed to create specialty');
  return specialty;
}

// Service operations
export async function findAllServices(tenantId: string): Promise<Service[]> {
  const [rows] = await mysql.execute(
    'SELECT * FROM services WHERE tenantId = ? ORDER BY name ASC',
    [tenantId]
  );
  return (rows as any[]).map(rowToService);
}

export async function findServiceById(id: string, tenantId: string): Promise<Service | null> {
  const [rows] = await mysql.execute('SELECT * FROM services WHERE id = ? AND tenantId = ?', [id, tenantId]);
  const result = rows as any[];
  return result.length > 0 ? rowToService(result[0]) : null;
}

export async function createService(data: {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  marginMinutes: number;
  price: number;
  seniaPercent: number;
}): Promise<Service> {
  await mysql.execute(
    'INSERT INTO services (id, tenantId, name, description, durationMinutes, marginMinutes, price, seniaPercent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      data.id,
      data.tenantId,
      data.name,
      data.description ?? null,
      data.durationMinutes,
      data.marginMinutes,
      data.price,
      data.seniaPercent,
    ]
  );
  const service = await findServiceById(data.id, data.tenantId);
  if (!service) throw new Error('Failed to create service');
  return service;
}

export async function updateService(
  id: string,
  tenantId: string,
  data: Partial<Pick<Service, 'name' | 'description' | 'durationMinutes' | 'marginMinutes' | 'price' | 'seniaPercent'>>
): Promise<Service> {
  const updates: string[] = [];
  const values: any[] = [];
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.durationMinutes !== undefined) {
    updates.push('durationMinutes = ?');
    values.push(data.durationMinutes);
  }
  if (data.marginMinutes !== undefined) {
    updates.push('marginMinutes = ?');
    values.push(data.marginMinutes);
  }
  if (data.price !== undefined) {
    updates.push('price = ?');
    values.push(data.price);
  }
  if (data.seniaPercent !== undefined) {
    updates.push('seniaPercent = ?');
    values.push(data.seniaPercent);
  }
  if (updates.length === 0) {
    const service = await findServiceById(id, tenantId);
    if (!service) throw new Error('Service not found');
    return service;
  }
  values.push(id, tenantId);
  await mysql.execute(`UPDATE services SET ${updates.join(', ')} WHERE id = ? AND tenantId = ?`, values);
  const service = await findServiceById(id, tenantId);
  if (!service) throw new Error('Failed to update service');
  return service;
}

export async function deleteService(id: string, tenantId: string): Promise<void> {
  await mysql.execute('DELETE FROM services WHERE id = ? AND tenantId = ?', [id, tenantId]);
}

// Location operations
export async function findLocationById(id: string, tenantId: string): Promise<Location | null> {
  const [rows] = await mysql.execute('SELECT * FROM locations WHERE id = ? AND tenantId = ?', [id, tenantId]);
  const result = rows as any[];
  return result.length > 0 ? rowToLocation(result[0]) : null;
}

export async function findAllLocations(tenantId: string): Promise<Location[]> {
  const [rows] = await mysql.execute('SELECT * FROM locations WHERE tenantId = ? ORDER BY createdAt DESC', [tenantId]);
  return (rows as any[]).map(rowToLocation);
}

export async function updateLocation(
  id: string,
  tenantId: string,
  data: Partial<Pick<Location, 'name' | 'address' | 'phone' | 'street' | 'streetNumber' | 'floor' | 'apartment' | 'postalCode' | 'country' | 'province' | 'neighborhood'>>
): Promise<Location> {
  const updates: string[] = [];
  const values: any[] = [];
  const newFieldUpdates: string[] = [];
  const newFieldValues: any[] = [];

  // Basic fields (always available)
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.address !== undefined) {
    updates.push('address = ?');
    values.push(data.address);
  }
  if (data.phone !== undefined) {
    updates.push('phone = ?');
    values.push(data.phone);
  }

  // New fields (may not exist yet)
  if (data.street !== undefined) {
    newFieldUpdates.push('street = ?');
    newFieldValues.push(data.street);
  }
  if (data.streetNumber !== undefined) {
    newFieldUpdates.push('streetNumber = ?');
    newFieldValues.push(data.streetNumber);
  }
  if (data.floor !== undefined) {
    newFieldUpdates.push('floor = ?');
    newFieldValues.push(data.floor);
  }
  if (data.apartment !== undefined) {
    newFieldUpdates.push('apartment = ?');
    newFieldValues.push(data.apartment);
  }
  if (data.postalCode !== undefined) {
    newFieldUpdates.push('postalCode = ?');
    newFieldValues.push(data.postalCode);
  }
  if (data.country !== undefined) {
    newFieldUpdates.push('country = ?');
    newFieldValues.push(data.country);
  }
  if (data.province !== undefined) {
    newFieldUpdates.push('province = ?');
    newFieldValues.push(data.province);
  }
  if (data.neighborhood !== undefined) {
    newFieldUpdates.push('neighborhood = ?');
    newFieldValues.push(data.neighborhood);
  }

  if (updates.length === 0 && newFieldUpdates.length === 0) {
    const location = await findLocationById(id, tenantId);
    if (!location) throw new Error('Location not found');
    return location;
  }

  // Try to update with all fields first
  const allUpdates = [...updates, ...newFieldUpdates];
  const allValues = [...values, ...newFieldValues, id, tenantId];
  
  try {
    await mysql.execute(`UPDATE locations SET ${allUpdates.join(', ')} WHERE id = ? AND tenantId = ?`, allValues);
  } catch (error: any) {
    // If new columns don't exist, only update basic fields
    if (error?.code === 'ER_BAD_FIELD_ERROR' && updates.length > 0) {
      const basicValues = [...values, id, tenantId];
      await mysql.execute(`UPDATE locations SET ${updates.join(', ')} WHERE id = ? AND tenantId = ?`, basicValues);
    } else {
      throw error;
    }
  }
  
  const location = await findLocationById(id, tenantId);
  if (!location) throw new Error('Failed to update location');
  return location;
}

export async function countAppointmentsByLocation(locationId: string, tenantId: string): Promise<number> {
  const [rows] = await mysql.execute(
    'SELECT COUNT(*) as count FROM appointments WHERE locationId = ? AND tenantId = ?',
    [locationId, tenantId]
  );
  const result = rows as any[];
  return result.length > 0 ? Number(result[0].count) : 0;
}

export async function deleteLocation(id: string, tenantId: string): Promise<void> {
  await mysql.execute('DELETE FROM locations WHERE id = ? AND tenantId = ?', [id, tenantId]);
}

export async function createLocation(data: {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  street?: string | null;
  streetNumber?: string | null;
  floor?: string | null;
  apartment?: string | null;
  postalCode?: string | null;
  country?: string | null;
  province?: string | null;
  neighborhood?: string | null;
  phone?: string | null;
}): Promise<Location> {
  // Try with all fields first (if migration has been run)
  try {
    await mysql.execute(
      'INSERT INTO locations (id, tenantId, name, address, street, streetNumber, floor, apartment, postalCode, country, province, neighborhood, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.id,
        data.tenantId,
        data.name,
        data.address,
        data.street || null,
        data.streetNumber || null,
        data.floor || null,
        data.apartment || null,
        data.postalCode || null,
        data.country || null,
        data.province || null,
        data.neighborhood || null,
        data.phone || null,
      ]
    );
  } catch (error: any) {
    // If new columns don't exist, fallback to basic fields only
    if (error?.code === 'ER_BAD_FIELD_ERROR') {
      await mysql.execute(
        'INSERT INTO locations (id, tenantId, name, address, phone) VALUES (?, ?, ?, ?, ?)',
        [data.id, data.tenantId, data.name, data.address, data.phone || null]
      );
    } else {
      throw error;
    }
  }
  const location = await findLocationById(data.id, data.tenantId);
  if (!location) throw new Error('Failed to create location');
  return location;
}

// ProfessionalProfile operations
export async function findProfessionalProfileByUserId(userId: string, tenantId: string): Promise<ProfessionalProfile | null> {
  const [rows] = await mysql.execute('SELECT * FROM professional_profiles WHERE userId = ? AND tenantId = ?', [userId, tenantId]);
  const result = rows as any[];
  return result.length > 0 ? rowToProfessionalProfile(result[0]) : null;
}

export async function createProfessionalProfile(data: {
  userId: string;
  tenantId: string;
  specialtyId: string;
  specialtyIds?: string[];
  isActive?: boolean;
  googleCalendarId?: string | null;
  color?: string | null;
  licenseNumber?: string | null;
  medicalCoverages?: string[] | null;
  availabilityConfig?: ProfessionalProfile['availabilityConfig'];
  availableDays?: number[] | null;
  availableHours?: { start: string; end: string } | null;
}): Promise<ProfessionalProfile> {
  // Use first specialtyId as primary for backward compatibility
  const primarySpecialtyId = data.specialtyId || (data.specialtyIds && data.specialtyIds.length > 0 ? data.specialtyIds[0] : '');

  const availableDaysJson = data.availableDays ? JSON.stringify(data.availableDays) : null;
  const availableHoursJson = data.availableHours ? JSON.stringify(data.availableHours) : null;
  const medicalCoveragesJson = data.medicalCoverages ? JSON.stringify(data.medicalCoverages) : null;
  const availabilityConfigJson = data.availabilityConfig ? JSON.stringify(data.availabilityConfig) : null;

  await mysql.execute(
    'INSERT INTO professional_profiles (userId, tenantId, specialtyId, isActive, googleCalendarId, color, licenseNumber, medicalCoverages, availabilityConfig, availableDays, availableHours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      data.userId,
      data.tenantId,
      primarySpecialtyId,
      data.isActive ?? true,
      data.googleCalendarId || null,
      data.color || null,
      data.licenseNumber || null,
      medicalCoveragesJson,
      availabilityConfigJson,
      availableDaysJson,
      availableHoursJson
    ]
  );

  // Add specialties to the many-to-many table
  const specialtyIds = data.specialtyIds || (data.specialtyId ? [data.specialtyId] : []);
  if (specialtyIds.length > 0) {
    try {
      const placeholders = specialtyIds.map(() => '(?, ?)').join(', ');
      const flattenedValues = specialtyIds.map(id => [data.userId, id]).flat();
      await mysql.execute(
        `INSERT INTO professional_specialties (userId, specialtyId) VALUES ${placeholders}`,
        flattenedValues
      );
    } catch (error: any) {
      // If table doesn't exist, continue (backward compatibility)
      if (error.code !== 'ER_NO_SUCH_TABLE') {
        throw error;
      }
    }
  }

  const profile = await findProfessionalProfileByUserId(data.userId, data.tenantId);
  if (!profile) throw new Error('Failed to create professional profile');
  return profile;
}

export async function updateProfessionalProfile(
  userId: string,
  tenantId: string,
  data: Partial<Pick<ProfessionalProfile, 'specialtyId' | 'isActive' | 'googleCalendarId' | 'color' | 'availableDays' | 'availableHours'>> & { specialtyIds?: string[] }
): Promise<ProfessionalProfile> {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.specialtyId !== undefined) {
    updates.push('specialtyId = ?');
    values.push(data.specialtyId);
  }
  if (data.isActive !== undefined) {
    updates.push('isActive = ?');
    values.push(data.isActive);
  }
  if (data.googleCalendarId !== undefined) {
    updates.push('googleCalendarId = ?');
    values.push(data.googleCalendarId);
  }
  if (data.color !== undefined) {
    updates.push('color = ?');
    values.push(data.color || null);
  }
  if (data.availableDays !== undefined) {
    updates.push('availableDays = ?');
    values.push(data.availableDays ? JSON.stringify(data.availableDays) : null);
  }
  if (data.availableHours !== undefined) {
    updates.push('availableHours = ?');
    values.push(data.availableHours ? JSON.stringify(data.availableHours) : null);
  }
  if ((data as any).licenseNumber !== undefined) {
    updates.push('licenseNumber = ?');
    values.push((data as any).licenseNumber || null);
  }
  if ((data as any).medicalCoverages !== undefined) {
    updates.push('medicalCoverages = ?');
    values.push((data as any).medicalCoverages ? JSON.stringify((data as any).medicalCoverages) : null);
  }
  if ((data as any).availabilityConfig !== undefined) {
    updates.push('availabilityConfig = ?');
    // Always stringify availabilityConfig, even if it's null (to clear it)
    const configValue = (data as any).availabilityConfig;
    values.push(configValue ? JSON.stringify(configValue) : null);
    console.log("updateProfessionalProfile - saving availabilityConfig:", {
      configValue,
      stringified: configValue ? JSON.stringify(configValue) : null,
    });
  }

  // Update many-to-many specialties relationship if provided
  if (data.specialtyIds !== undefined) {
    // Delete existing specialties for this user
    try {
      await mysql.execute('DELETE FROM professional_specialties WHERE userId = ?', [userId]);
    } catch (error: any) {
      // If table doesn't exist, continue (backward compatibility)
      if (error.code !== 'ER_NO_SUCH_TABLE') {
        throw error;
      }
    }

    // Insert new specialties
    if (data.specialtyIds.length > 0) {
      try {
        const placeholders = data.specialtyIds.map(() => '(?, ?)').join(', ');
        const flattenedValues = data.specialtyIds.map(id => [userId, id]).flat();
        await mysql.execute(
          `INSERT INTO professional_specialties (userId, specialtyId) VALUES ${placeholders}`,
          flattenedValues
        );
      } catch (error: any) {
        // If table doesn't exist, continue (backward compatibility)
        if (error.code !== 'ER_NO_SUCH_TABLE') {
          throw error;
        }
      }
    }

    // Update primary specialtyId if not explicitly set
    if (data.specialtyId === undefined && data.specialtyIds.length > 0) {
      updates.push('specialtyId = ?');
      values.push(data.specialtyIds[0]);
    }
  }

  if (updates.length === 0) {
    const profile = await findProfessionalProfileByUserId(userId, tenantId);
    if (!profile) throw new Error('Professional profile not found');
    return profile;
  }

  values.push(userId, tenantId);
  await mysql.execute(`UPDATE professional_profiles SET ${updates.join(', ')} WHERE userId = ? AND tenantId = ?`, values);
  const profile = await findProfessionalProfileByUserId(userId, tenantId);
  if (!profile) throw new Error('Failed to update professional profile');
  return profile;
}

// GoogleOAuthToken operations
export async function findGoogleOAuthTokenByUserId(userId: string, tenantId: string): Promise<GoogleOAuthToken | null> {
  const [rows] = await mysql.execute('SELECT * FROM google_oauth_tokens WHERE userId = ? AND tenantId = ?', [userId, tenantId]);
  const result = rows as any[];
  return result.length > 0 ? rowToGoogleOAuthToken(result[0]) : null;
}

export async function upsertGoogleOAuthToken(data: {
  id: string;
  tenantId: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  scope?: string | null;
  tokenType?: string | null;
  expiryDate?: Date | null;
}): Promise<GoogleOAuthToken> {
  await mysql.execute(
    `INSERT INTO google_oauth_tokens (id, tenantId, userId, accessToken, refreshToken, scope, tokenType, expiryDate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       accessToken = VALUES(accessToken),
       refreshToken = VALUES(refreshToken),
       scope = VALUES(scope),
       tokenType = VALUES(tokenType),
       expiryDate = VALUES(expiryDate),
       updatedAt = CURRENT_TIMESTAMP`,
    [data.id, data.tenantId, data.userId, data.accessToken, data.refreshToken, data.scope || null, data.tokenType || null, data.expiryDate || null]
  );
  const token = await findGoogleOAuthTokenByUserId(data.userId, data.tenantId);
  if (!token) throw new Error('Failed to upsert Google OAuth token');
  return token;
}

// Appointment operations
export async function findAppointmentById(id: string, tenantId: string): Promise<Appointment | null> {
  const [rows] = await mysql.execute('SELECT * FROM appointments WHERE id = ? AND tenantId = ?', [id, tenantId]);
  const result = rows as any[];
  return result.length > 0 ? rowToAppointment(result[0]) : null;
}

export async function createAppointment(data: {
  id: string;
  tenantId: string;
  status: AppointmentStatus;
  startAt: Date;
  endAt: Date;
  patientId: string;
  professionalId: string;
  locationId: string | null;
  specialtyId: string | null;
  googleEventId?: string | null;
  notes?: string | null;
}): Promise<Appointment> {
  await mysql.execute(
    `INSERT INTO appointments (id, tenantId, status, startAt, endAt, patientId, professionalId, locationId, specialtyId, googleEventId, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.tenantId,
      data.status,
      data.startAt,
      data.endAt,
      data.patientId,
      data.professionalId,
      data.locationId || null,
      data.specialtyId || null,
      data.googleEventId || null,
      data.notes || null,
    ]
  );
  const appointment = await findAppointmentById(data.id, data.tenantId);
  if (!appointment) throw new Error('Failed to create appointment');
  return appointment;
}

export async function updateAppointmentStatus(id: string, tenantId: string, status: AppointmentStatus): Promise<Appointment> {
  await mysql.execute('UPDATE appointments SET status = ? WHERE id = ? AND tenantId = ?', [status, id, tenantId]);
  const appointment = await findAppointmentById(id, tenantId);
  if (!appointment) throw new Error('Appointment not found');
  return appointment;
}

export async function updateAppointmentGoogleEventId(id: string, tenantId: string, googleEventId: string | null): Promise<Appointment> {
  await mysql.execute('UPDATE appointments SET googleEventId = ? WHERE id = ? AND tenantId = ?', [googleEventId, id, tenantId]);
  const appointment = await findAppointmentById(id, tenantId);
  if (!appointment) throw new Error('Appointment not found');
  return appointment;
}

export async function findAppointmentWithRelations(id: string, tenantId: string): Promise<{
  appointment: Appointment;
  patient: User;
  professional: User & { professional: ProfessionalProfile | null; googleOAuth: GoogleOAuthToken | null };
  location: Location;
  specialty: Specialty;
} | null> {
  const [rows] = await mysql.execute(
    `SELECT 
      a.*,
      p.id as p_id, p.tenantId as p_tenantId, p.email as p_email, p.name as p_name, p.passwordHash as p_passwordHash, 
      p.role as p_role, p.createdAt as p_createdAt, p.updatedAt as p_updatedAt,
      prof.id as prof_id, prof.tenantId as prof_tenantId, prof.email as prof_email, prof.name as prof_name, prof.passwordHash as prof_passwordHash,
      prof.role as prof_role, prof.createdAt as prof_createdAt, prof.updatedAt as prof_updatedAt,
      pp.userId as pp_userId, pp.tenantId as pp_tenantId, pp.specialtyId as pp_specialtyId, pp.isActive as pp_isActive,
      pp.googleCalendarId as pp_googleCalendarId, pp.color as pp_color,
      pp.createdAt as pp_createdAt, pp.updatedAt as pp_updatedAt,
      go.id as go_id, go.tenantId as go_tenantId, go.userId as go_userId, go.accessToken as go_accessToken, go.refreshToken as go_refreshToken,
      go.scope as go_scope, go.tokenType as go_tokenType, go.expiryDate as go_expiryDate,
      go.createdAt as go_createdAt, go.updatedAt as go_updatedAt,
      l.id as l_id, l.tenantId as l_tenantId, l.name as l_name, l.address as l_address, l.phone as l_phone,
      l.createdAt as l_createdAt, l.updatedAt as l_updatedAt,
      s.id as s_id, s.tenantId as s_tenantId, s.name as s_name, s.createdAt as s_createdAt, s.updatedAt as s_updatedAt
    FROM appointments a
    INNER JOIN users p ON a.patientId = p.id AND a.tenantId = p.tenantId
    INNER JOIN users prof ON a.professionalId = prof.id AND a.tenantId = prof.tenantId
    LEFT JOIN professional_profiles pp ON prof.id = pp.userId AND prof.tenantId = pp.tenantId
    LEFT JOIN google_oauth_tokens go ON prof.id = go.userId AND prof.tenantId = go.tenantId
    INNER JOIN locations l ON a.locationId = l.id AND a.tenantId = l.tenantId
    INNER JOIN specialties s ON a.specialtyId = s.id AND a.tenantId = s.tenantId
    WHERE a.id = ? AND a.tenantId = ?`,
    [id, tenantId]
  );

  const result = rows as any[];
  if (result.length === 0) return null;

  const row = result[0];
  return {
    appointment: rowToAppointment(row),
    patient: rowToUser({
      id: row.p_id,
      tenantId: row.p_tenantId,
      email: row.p_email,
      name: row.p_name,
      passwordHash: row.p_passwordHash,
      role: row.p_role,
      createdAt: row.p_createdAt,
      updatedAt: row.p_updatedAt,
    }),
    professional: {
      ...rowToUser({
        id: row.prof_id,
        tenantId: row.prof_tenantId,
        email: row.prof_email,
        name: row.prof_name,
        passwordHash: row.prof_passwordHash,
        role: row.prof_role,
        createdAt: row.prof_createdAt,
        updatedAt: row.prof_updatedAt,
      }),
      professional: row.pp_userId ? rowToProfessionalProfile({
        userId: row.pp_userId,
        tenantId: row.pp_tenantId,
        specialtyId: row.pp_specialtyId,
        isActive: row.pp_isActive,
        googleCalendarId: row.pp_googleCalendarId,
        color: (row.pp_color && row.pp_color.trim() !== '') ? row.pp_color.trim() : null,
        createdAt: row.pp_createdAt,
        updatedAt: row.pp_updatedAt,
      }) : null,
      googleOAuth: row.go_id ? rowToGoogleOAuthToken({
        id: row.go_id,
        tenantId: row.go_tenantId,
        userId: row.go_userId,
        accessToken: row.go_accessToken,
        refreshToken: row.go_refreshToken,
        scope: row.go_scope,
        tokenType: row.go_tokenType,
        expiryDate: row.go_expiryDate,
        createdAt: row.go_createdAt,
        updatedAt: row.go_updatedAt,
      }) : null,
    },
    location: rowToLocation({
      id: row.l_id,
      tenantId: row.l_tenantId,
      name: row.l_name,
      address: row.l_address,
      phone: row.l_phone,
      createdAt: row.l_createdAt,
      updatedAt: row.l_updatedAt,
    }),
    specialty: rowToSpecialty({
      id: row.s_id,
      tenantId: row.s_tenantId,
      name: row.s_name,
      createdAt: row.s_createdAt,
      updatedAt: row.s_updatedAt,
    }),
  };
}

export async function findAppointmentsByDateRange(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  filters?: {
    patientId?: string;
    professionalId?: string;
    status?: AppointmentStatus;
  }
): Promise<(Appointment & { patient: User; professional: User & { professional: ProfessionalProfile | null }; location: Location; specialty: Specialty })[]> {
  let query = `
    SELECT 
      a.*,
      p.id as p_id, p.email as p_email, p.name as p_name, p.passwordHash as p_passwordHash, 
      p.role as p_role, p.createdAt as p_createdAt, p.updatedAt as p_updatedAt,
      prof.id as prof_id, prof.email as prof_email, prof.name as prof_name, prof.passwordHash as prof_passwordHash,
      prof.role as prof_role, prof.createdAt as prof_createdAt, prof.updatedAt as prof_updatedAt,
      pp.userId as pp_userId, pp.specialtyId as pp_specialtyId, pp.isActive as pp_isActive,
      pp.googleCalendarId as pp_googleCalendarId, pp.color as pp_color,
      pp.createdAt as pp_createdAt, pp.updatedAt as pp_updatedAt,
      l.id as l_id, l.name as l_name, l.address as l_address, l.phone as l_phone,
      l.createdAt as l_createdAt, l.updatedAt as l_updatedAt,
      s.id as s_id, s.name as s_name, s.createdAt as s_createdAt, s.updatedAt as s_updatedAt
    FROM appointments a
    INNER JOIN users p ON a.patientId = p.id AND a.tenantId = p.tenantId
    INNER JOIN users prof ON a.professionalId = prof.id AND a.tenantId = prof.tenantId
    LEFT JOIN professional_profiles pp ON prof.id = pp.userId AND prof.tenantId = pp.tenantId
    INNER JOIN locations l ON a.locationId = l.id AND a.tenantId = l.tenantId
    INNER JOIN specialties s ON a.specialtyId = s.id AND a.tenantId = s.tenantId
    WHERE a.startAt >= ? AND a.startAt <= ? AND a.tenantId = ?
  `;

  const params: any[] = [startDate, endDate, tenantId];

  if (filters?.patientId) {
    query += ' AND a.patientId = ?';
    params.push(filters.patientId);
  }

  if (filters?.professionalId) {
    query += ' AND a.professionalId = ?';
    params.push(filters.professionalId);
  }

  if (filters?.status) {
    query += ' AND a.status = ?';
    params.push(filters.status);
  }

  query += ' ORDER BY a.startAt ASC';

  const [rows] = await mysql.execute(query, params);
  const result = rows as any[];

  return result.map(row => ({
    ...rowToAppointment(row),
    patient: rowToUser({
      id: row.p_id,
      tenantId: row.p_tenantId,
      email: row.p_email,
      name: row.p_name,
      passwordHash: row.p_passwordHash,
      role: row.p_role,
      createdAt: row.p_createdAt,
      updatedAt: row.p_updatedAt,
    }),
    professional: {
      ...rowToUser({
        id: row.prof_id,
        tenantId: row.prof_tenantId,
        email: row.prof_email,
        name: row.prof_name,
        passwordHash: row.prof_passwordHash,
        role: row.prof_role,
        createdAt: row.prof_createdAt,
        updatedAt: row.prof_updatedAt,
      }),
      professional: row.pp_userId ? rowToProfessionalProfile({
        userId: row.pp_userId,
        tenantId: row.pp_tenantId,
        specialtyId: row.pp_specialtyId,
        isActive: row.pp_isActive,
        googleCalendarId: row.pp_googleCalendarId,
        color: (row.pp_color && row.pp_color.trim() !== '') ? row.pp_color.trim() : null,
        createdAt: row.pp_createdAt,
        updatedAt: row.pp_updatedAt,
      }) : null,
    },
    location: rowToLocation({
      id: row.l_id,
      tenantId: row.l_tenantId,
      name: row.l_name,
      address: row.l_address,
      phone: row.l_phone,
      createdAt: row.l_createdAt,
      updatedAt: row.l_updatedAt,
    }),
    specialty: rowToSpecialty({
      id: row.s_id,
      tenantId: row.s_tenantId,
      name: row.s_name,
      createdAt: row.s_createdAt,
      updatedAt: row.s_updatedAt,
    }),
  }));
}

export async function updateAppointment(data: {
  id: string;
  tenantId: string;
  startAt?: Date;
  endAt?: Date;
  status?: AppointmentStatus;
  notes?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: Role | null;
  patientId?: string;
  professionalId?: string;
  locationId?: string;
  specialtyId?: string;
}): Promise<Appointment> {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.startAt !== undefined) {
    updates.push('startAt = ?');
    values.push(data.startAt);
  }
  if (data.endAt !== undefined) {
    updates.push('endAt = ?');
    values.push(data.endAt);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }
  if (data.notes !== undefined) {
    updates.push('notes = ?');
    values.push(data.notes);
  }
  if (data.cancellationReason !== undefined) {
    updates.push('cancellationReason = ?');
    values.push(data.cancellationReason);
  }
  if (data.cancelledBy !== undefined) {
    updates.push('cancelledBy = ?');
    values.push(data.cancelledBy);
  }
  if (data.patientId !== undefined) {
    updates.push('patientId = ?');
    values.push(data.patientId);
  }
  if (data.professionalId !== undefined) {
    updates.push('professionalId = ?');
    values.push(data.professionalId);
  }
  if (data.locationId !== undefined) {
    updates.push('locationId = ?');
    values.push(data.locationId);
  }
  if (data.specialtyId !== undefined) {
    updates.push('specialtyId = ?');
    values.push(data.specialtyId);
  }

  if (updates.length === 0) {
    const appointment = await findAppointmentById(data.id, data.tenantId);
    if (!appointment) throw new Error('Appointment not found');
    return appointment;
  }

  values.push(data.id, data.tenantId);
  await mysql.execute(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ? AND tenantId = ?`, values);
  const appointment = await findAppointmentById(data.id, data.tenantId);
  if (!appointment) throw new Error('Appointment not found');
  return appointment;
}

export async function deleteAppointment(id: string, tenantId: string): Promise<void> {
  await mysql.execute('DELETE FROM appointments WHERE id = ? AND tenantId = ?', [id, tenantId]);
}

/** Delete all appointments for a professional (required before deleting the user due to FK RESTRICT). */
export async function deleteAppointmentsByProfessional(professionalId: string, tenantId: string): Promise<void> {
  await mysql.execute('DELETE FROM appointments WHERE professionalId = ? AND tenantId = ?', [professionalId, tenantId]);
}


// MedicalCoverage and MedicalPlan operations
export async function findAllMedicalCoveragesWithPlans(tenantId: string): Promise<MedicalCoverageWithPlans[]> {
  const [coverageRows] = await mysql.execute('SELECT * FROM medical_coverages WHERE tenantId = ? ORDER BY name ASC', [tenantId]);
  const coverages = coverageRows as any[];

  const results: MedicalCoverageWithPlans[] = [];

  for (const coverage of coverages) {
    const [planRows] = await mysql.execute('SELECT * FROM medical_plans WHERE coverageId = ? AND tenantId = ? ORDER BY name ASC', [coverage.id, tenantId]);
    results.push({
      ...coverage,
      plans: planRows as MedicalPlan[]
    });
  }

  return results;
}

export async function findMedicalCoverageById(id: string, tenantId: string): Promise<MedicalCoverageWithPlans | null> {
  const [rows] = await mysql.execute('SELECT * FROM medical_coverages WHERE id = ? AND tenantId = ?', [id, tenantId]);
  const result = rows as any[];
  if (result.length === 0) return null;

  const coverage = result[0];
  const [planRows] = await mysql.execute('SELECT * FROM medical_plans WHERE coverageId = ? AND tenantId = ? ORDER BY name ASC', [id, tenantId]);

  return {
    ...coverage,
    plans: planRows as MedicalPlan[]
  };
}

export async function createMedicalCoverage(data: { id: string, tenantId: string, name: string, plans: { id: string, name: string }[] }): Promise<MedicalCoverageWithPlans> {
  await mysql.execute('INSERT INTO medical_coverages (id, tenantId, name) VALUES (?, ?, ?)', [data.id, data.tenantId, data.name]);

  for (const plan of data.plans) {
    await mysql.execute('INSERT INTO medical_plans (id, tenantId, coverageId, name) VALUES (?, ?, ?, ?)', [plan.id, data.tenantId, data.id, plan.name]);
  }

  const result = await findMedicalCoverageById(data.id, data.tenantId);
  if (!result) throw new Error('Failed to create medical coverage');
  return result;
}

export async function updateMedicalCoverage(id: string, tenantId: string, name: string, plans: { id?: string, name: string }[]): Promise<MedicalCoverageWithPlans> {
  await mysql.execute('UPDATE medical_coverages SET name = ? WHERE id = ? AND tenantId = ?', [name, id, tenantId]);

  // Simple approach: get existing plans, compare and update/delete/insert
  const [existingPlanRows] = await mysql.execute('SELECT id FROM medical_plans WHERE coverageId = ? AND tenantId = ?', [id, tenantId]);
  const existingPlanIds = (existingPlanRows as any[]).map(row => row.id);

  const currentPlanIds = plans.map(p => p.id).filter(Boolean) as string[];

  // Delete plans not in the new list
  const toDelete = existingPlanIds.filter(id => !currentPlanIds.includes(id));
  if (toDelete.length > 0) {
    await mysql.execute(`DELETE FROM medical_plans WHERE id IN (${toDelete.map(() => '?').join(',')}) AND tenantId = ?`, [...toDelete, tenantId]);
  }

  // Update or insert plans
  for (const plan of plans) {
    if (plan.id && existingPlanIds.includes(plan.id)) {
      await mysql.execute('UPDATE medical_plans SET name = ? WHERE id = ? AND tenantId = ?', [plan.name, plan.id, tenantId]);
    } else {
      const newPlanId = plan.id || crypto.randomUUID();
      await mysql.execute('INSERT INTO medical_plans (id, tenantId, coverageId, name) VALUES (?, ?, ?, ?)', [newPlanId, tenantId, id, plan.name]);
    }
  }

  const result = await findMedicalCoverageById(id, tenantId);
  if (!result) throw new Error('Failed to update medical coverage');
  return result;
}

export async function deleteMedicalCoverage(id: string, tenantId: string): Promise<void> {
  // First delete plans
  await mysql.execute('DELETE FROM medical_plans WHERE coverageId = ? AND tenantId = ?', [id, tenantId]);
  // Then delete coverage
  await mysql.execute('DELETE FROM medical_coverages WHERE id = ? AND tenantId = ?', [id, tenantId]);
}

// Helper para convertir filas de MySQL a objetos Tenant
function rowToTenant(row: any): Tenant {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logoUrl || null,
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createTenant(data: { id: string; name: string; logoUrl?: string | null }): Promise<Tenant> {
  await mysql.execute(
    'INSERT INTO tenants (id, name, logoUrl, isActive) VALUES (?, ?, ?, ?)',
    [data.id, data.name, data.logoUrl || null, true]
  );
  const result = await findTenantById(data.id);
  if (!result) throw new Error('Failed to create tenant');
  return result;
}

export async function findAllTenants(): Promise<Tenant[]> {
  const [rows] = await mysql.execute('SELECT * FROM tenants ORDER BY name ASC');
  return (rows as any[]).map(rowToTenant);
}

export async function findTenantById(id: string): Promise<Tenant | null> {
  const [rows] = await mysql.execute('SELECT * FROM tenants WHERE id = ?', [id]);
  const result = rows as any[];
  return result.length > 0 ? rowToTenant(result[0]) : null;
}

export async function deleteTenant(id: string): Promise<void> {
  // Note: Foreign key constraints with ON DELETE CASCADE will handle related data
  await mysql.execute('DELETE FROM tenants WHERE id = ?', [id]);
}
