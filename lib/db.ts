import mysql from './mysql';
import type { User, Specialty, Location, ProfessionalProfile, GoogleOAuthToken, Appointment, Role, AppointmentStatus, MedicalCoverage, MedicalPlan, MedicalCoverageWithPlans } from './types';

// Helper para convertir filas de MySQL a objetos tipados
function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    firstName: row.firstName || null,
    lastName: row.lastName || null,
    phone: row.phone || null,
    address: row.address || null,
    dateOfBirth: row.dateOfBirth || null,
    admissionDate: row.admissionDate || null,
    gender: row.gender || null,
    nationality: row.nationality || null,
    passwordHash: row.passwordHash,
    role: row.role as Role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToSpecialty(row: any): Specialty {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToLocation(row: any): Location {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
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
        return typeof row.availabilityConfig === 'string' ? JSON.parse(row.availabilityConfig) : row.availabilityConfig;
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
export async function findUserById(id: string): Promise<User | null> {
  const [rows] = await mysql.execute('SELECT * FROM users WHERE id = ?', [id]);
  const result = rows as any[];
  return result.length > 0 ? rowToUser(result[0]) : null;
}

export async function deleteUser(id: string): Promise<void> {
  await mysql.execute('DELETE FROM users WHERE id = ?', [id]);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const [rows] = await mysql.execute('SELECT * FROM users WHERE email = ?', [email]);
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
  dateOfBirth?: Date | null;
  admissionDate?: Date | null;
  gender?: string | null;
  nationality?: string | null;
  passwordHash: string;
  role: Role;
}): Promise<User> {
  await mysql.execute(
    'INSERT INTO users (id, email, name, firstName, lastName, phone, address, dateOfBirth, admissionDate, gender, nationality, passwordHash, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      data.id,
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
      data.passwordHash,
      data.role,
    ]
  );
  const user = await findUserById(data.id);
  if (!user) throw new Error('Failed to create user');
  return user;
}

export async function updateUser(
  id: string,
  data: Partial<Pick<User, 'name' | 'firstName' | 'lastName' | 'email' | 'phone' | 'address' | 'dateOfBirth' | 'admissionDate' | 'gender' | 'nationality' | 'passwordHash' | 'role'>>
): Promise<User> {
  const updates: string[] = [];
  const values: any[] = [];

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
    updates.push('role = ?');
    values.push(data.role);
  }

  if (updates.length === 0) {
    const user = await findUserById(id);
    if (!user) throw new Error('User not found');
    return user;
  }

  values.push(id);
  await mysql.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  const user = await findUserById(id);
  if (!user) throw new Error('Failed to update user');
  return user;
}

export async function findUsersByRole(role: Role): Promise<User[]> {
  const [rows] = await mysql.execute('SELECT * FROM users WHERE role = ?', [role]);
  return (rows as any[]).map(rowToUser);
}

export async function findAllUsers(): Promise<User[]> {
  const [rows] = await mysql.execute('SELECT * FROM users ORDER BY createdAt DESC');
  return (rows as any[]).map(rowToUser);
}

export async function findUsersWithProfessionalProfile(): Promise<(User & { professional: (ProfessionalProfile & { specialty: Specialty | null; specialties: Specialty[] }) | null })[]> {
  // First get all professionals with their profiles
  const [profileRows] = await mysql.execute(
    `SELECT 
      u.*,
      pp.userId as pp_userId,
      pp.specialtyId as pp_specialtyId,
      pp.isActive as pp_isActive,
      pp.googleCalendarId as pp_googleCalendarId,
      pp.color as pp_color,
      pp.availableDays as pp_availableDays,
      pp.availableHours as pp_availableHours,
      pp.createdAt as pp_createdAt,
      pp.updatedAt as pp_updatedAt
    FROM users u
    LEFT JOIN professional_profiles pp ON u.id = pp.userId
    WHERE u.role = 'PROFESSIONAL'
    ORDER BY u.createdAt DESC`
  );

  // Then get all specialties for each professional from the many-to-many table
  // Use LEFT JOIN in case the table doesn't exist yet or has no data
  let specialtyRows: any[] = [];
  try {
    const [rows] = await mysql.execute(
      `SELECT 
        ps.userId,
        s.id as s_id,
        s.name as s_name,
        s.createdAt as s_createdAt,
        s.updatedAt as s_updatedAt
      FROM professional_specialties ps
      INNER JOIN specialties s ON ps.specialtyId = s.id
      ORDER BY ps.userId, s.name`
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
            specialtyId: row.pp_specialtyId || (primarySpecialty?.id || ''),
            isActive: row.pp_isActive,
            googleCalendarId: row.pp_googleCalendarId,
            color: (row.pp_color && row.pp_color.trim() !== '') ? row.pp_color.trim() : null,
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
export async function findSpecialtyById(id: string): Promise<Specialty | null> {
  const [rows] = await mysql.execute('SELECT * FROM specialties WHERE id = ?', [id]);
  const result = rows as any[];
  return result.length > 0 ? rowToSpecialty(result[0]) : null;
}

export async function deleteSpecialty(id: string): Promise<void> {
  await mysql.execute('DELETE FROM specialties WHERE id = ?', [id]);
}

export async function findAllSpecialties(): Promise<Specialty[]> {
  const [rows] = await mysql.execute('SELECT * FROM specialties ORDER BY name ASC');
  return (rows as any[]).map(rowToSpecialty);
}

export async function updateSpecialty(id: string, data: Partial<Pick<Specialty, 'name'>>): Promise<Specialty> {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }

  if (updates.length === 0) {
    const specialty = await findSpecialtyById(id);
    if (!specialty) throw new Error('Specialty not found');
    return specialty;
  }

  values.push(id);
  await mysql.execute(`UPDATE specialties SET ${updates.join(', ')} WHERE id = ?`, values);
  const specialty = await findSpecialtyById(id);
  if (!specialty) throw new Error('Failed to update specialty');
  return specialty;
}

export async function countProfessionalsBySpecialty(specialtyId: string): Promise<number> {
  const [rows] = await mysql.execute(
    'SELECT COUNT(*) as count FROM professional_profiles WHERE specialtyId = ?',
    [specialtyId]
  );
  const result = rows as any[];
  return result.length > 0 ? Number(result[0].count) : 0;
}

export async function createSpecialty(data: { id: string; name: string }): Promise<Specialty> {
  await mysql.execute('INSERT INTO specialties (id, name) VALUES (?, ?)', [data.id, data.name]);
  const specialty = await findSpecialtyById(data.id);
  if (!specialty) throw new Error('Failed to create specialty');
  return specialty;
}

// Location operations
export async function findLocationById(id: string): Promise<Location | null> {
  const [rows] = await mysql.execute('SELECT * FROM locations WHERE id = ?', [id]);
  const result = rows as any[];
  return result.length > 0 ? rowToLocation(result[0]) : null;
}

export async function findAllLocations(): Promise<Location[]> {
  const [rows] = await mysql.execute('SELECT * FROM locations ORDER BY createdAt DESC');
  return (rows as any[]).map(rowToLocation);
}

export async function updateLocation(
  id: string,
  data: Partial<Pick<Location, 'name' | 'address' | 'phone'>>
): Promise<Location> {
  const updates: string[] = [];
  const values: any[] = [];

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

  if (updates.length === 0) {
    const location = await findLocationById(id);
    if (!location) throw new Error('Location not found');
    return location;
  }

  values.push(id);
  await mysql.execute(`UPDATE locations SET ${updates.join(', ')} WHERE id = ?`, values);
  const location = await findLocationById(id);
  if (!location) throw new Error('Failed to update location');
  return location;
}

export async function countAppointmentsByLocation(locationId: string): Promise<number> {
  const [rows] = await mysql.execute(
    'SELECT COUNT(*) as count FROM appointments WHERE locationId = ?',
    [locationId]
  );
  const result = rows as any[];
  return result.length > 0 ? Number(result[0].count) : 0;
}

export async function createLocation(data: {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
}): Promise<Location> {
  await mysql.execute(
    'INSERT INTO locations (id, name, address, phone) VALUES (?, ?, ?, ?)',
    [data.id, data.name, data.address, data.phone || null]
  );
  const location = await findLocationById(data.id);
  if (!location) throw new Error('Failed to create location');
  return location;
}

// ProfessionalProfile operations
export async function findProfessionalProfileByUserId(userId: string): Promise<ProfessionalProfile | null> {
  const [rows] = await mysql.execute('SELECT * FROM professional_profiles WHERE userId = ?', [userId]);
  const result = rows as any[];
  return result.length > 0 ? rowToProfessionalProfile(result[0]) : null;
}

export async function createProfessionalProfile(data: {
  userId: string;
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
    'INSERT INTO professional_profiles (userId, specialtyId, isActive, googleCalendarId, color, licenseNumber, medicalCoverages, availabilityConfig, availableDays, availableHours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      data.userId,
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

  const profile = await findProfessionalProfileByUserId(data.userId);
  if (!profile) throw new Error('Failed to create professional profile');
  return profile;
}

export async function updateProfessionalProfile(
  userId: string,
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
    values.push((data as any).availabilityConfig ? JSON.stringify((data as any).availabilityConfig) : null);
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
    const profile = await findProfessionalProfileByUserId(userId);
    if (!profile) throw new Error('Professional profile not found');
    return profile;
  }

  values.push(userId);
  await mysql.execute(`UPDATE professional_profiles SET ${updates.join(', ')} WHERE userId = ?`, values);
  const profile = await findProfessionalProfileByUserId(userId);
  if (!profile) throw new Error('Failed to update professional profile');
  return profile;
}

// GoogleOAuthToken operations
export async function findGoogleOAuthTokenByUserId(userId: string): Promise<GoogleOAuthToken | null> {
  const [rows] = await mysql.execute('SELECT * FROM google_oauth_tokens WHERE userId = ?', [userId]);
  const result = rows as any[];
  return result.length > 0 ? rowToGoogleOAuthToken(result[0]) : null;
}

export async function upsertGoogleOAuthToken(data: {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  scope?: string | null;
  tokenType?: string | null;
  expiryDate?: Date | null;
}): Promise<GoogleOAuthToken> {
  await mysql.execute(
    `INSERT INTO google_oauth_tokens (id, userId, accessToken, refreshToken, scope, tokenType, expiryDate)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       accessToken = VALUES(accessToken),
       refreshToken = VALUES(refreshToken),
       scope = VALUES(scope),
       tokenType = VALUES(tokenType),
       expiryDate = VALUES(expiryDate),
       updatedAt = CURRENT_TIMESTAMP`,
    [data.id, data.userId, data.accessToken, data.refreshToken, data.scope || null, data.tokenType || null, data.expiryDate || null]
  );
  const token = await findGoogleOAuthTokenByUserId(data.userId);
  if (!token) throw new Error('Failed to upsert Google OAuth token');
  return token;
}

// Appointment operations
export async function findAppointmentById(id: string): Promise<Appointment | null> {
  const [rows] = await mysql.execute('SELECT * FROM appointments WHERE id = ?', [id]);
  const result = rows as any[];
  return result.length > 0 ? rowToAppointment(result[0]) : null;
}

export async function createAppointment(data: {
  id: string;
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
    `INSERT INTO appointments (id, status, startAt, endAt, patientId, professionalId, locationId, specialtyId, googleEventId, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id,
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
  const appointment = await findAppointmentById(data.id);
  if (!appointment) throw new Error('Failed to create appointment');
  return appointment;
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
  await mysql.execute('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
  const appointment = await findAppointmentById(id);
  if (!appointment) throw new Error('Appointment not found');
  return appointment;
}

export async function updateAppointmentGoogleEventId(id: string, googleEventId: string | null): Promise<Appointment> {
  await mysql.execute('UPDATE appointments SET googleEventId = ? WHERE id = ?', [googleEventId, id]);
  const appointment = await findAppointmentById(id);
  if (!appointment) throw new Error('Appointment not found');
  return appointment;
}

export async function findAppointmentWithRelations(id: string): Promise<{
  appointment: Appointment;
  patient: User;
  professional: User & { professional: ProfessionalProfile | null; googleOAuth: GoogleOAuthToken | null };
  location: Location;
  specialty: Specialty;
} | null> {
  const [rows] = await mysql.execute(
    `SELECT 
      a.*,
      p.id as p_id, p.email as p_email, p.name as p_name, p.passwordHash as p_passwordHash, 
      p.role as p_role, p.createdAt as p_createdAt, p.updatedAt as p_updatedAt,
      prof.id as prof_id, prof.email as prof_email, prof.name as prof_name, prof.passwordHash as prof_passwordHash,
      prof.role as prof_role, prof.createdAt as prof_createdAt, prof.updatedAt as prof_updatedAt,
      pp.userId as pp_userId, pp.specialtyId as pp_specialtyId, pp.isActive as pp_isActive,
      pp.googleCalendarId as pp_googleCalendarId, pp.color as pp_color,
      pp.createdAt as pp_createdAt, pp.updatedAt as pp_updatedAt,
      go.id as go_id, go.userId as go_userId, go.accessToken as go_accessToken, go.refreshToken as go_refreshToken,
      go.scope as go_scope, go.tokenType as go_tokenType, go.expiryDate as go_expiryDate,
      go.createdAt as go_createdAt, go.updatedAt as go_updatedAt,
      l.id as l_id, l.name as l_name, l.address as l_address, l.phone as l_phone,
      l.createdAt as l_createdAt, l.updatedAt as l_updatedAt,
      s.id as s_id, s.name as s_name, s.createdAt as s_createdAt, s.updatedAt as s_updatedAt
    FROM appointments a
    INNER JOIN users p ON a.patientId = p.id
    INNER JOIN users prof ON a.professionalId = prof.id
    LEFT JOIN professional_profiles pp ON prof.id = pp.userId
    LEFT JOIN google_oauth_tokens go ON prof.id = go.userId
    INNER JOIN locations l ON a.locationId = l.id
    INNER JOIN specialties s ON a.specialtyId = s.id
    WHERE a.id = ?`,
    [id]
  );

  const result = rows as any[];
  if (result.length === 0) return null;

  const row = result[0];
  return {
    appointment: rowToAppointment(row),
    patient: rowToUser({
      id: row.p_id,
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
        email: row.prof_email,
        name: row.prof_name,
        passwordHash: row.prof_passwordHash,
        role: row.prof_role,
        createdAt: row.prof_createdAt,
        updatedAt: row.prof_updatedAt,
      }),
      professional: row.pp_userId ? rowToProfessionalProfile({
        userId: row.pp_userId,
        specialtyId: row.pp_specialtyId,
        isActive: row.pp_isActive,
        googleCalendarId: row.pp_googleCalendarId,
        color: (row.pp_color && row.pp_color.trim() !== '') ? row.pp_color.trim() : null,
        createdAt: row.pp_createdAt,
        updatedAt: row.pp_updatedAt,
      }) : null,
      googleOAuth: row.go_id ? rowToGoogleOAuthToken({
        id: row.go_id,
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
      name: row.l_name,
      address: row.l_address,
      phone: row.l_phone,
      createdAt: row.l_createdAt,
      updatedAt: row.l_updatedAt,
    }),
    specialty: rowToSpecialty({
      id: row.s_id,
      name: row.s_name,
      createdAt: row.s_createdAt,
      updatedAt: row.s_updatedAt,
    }),
  };
}

export async function findAppointmentsByDateRange(
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
    INNER JOIN users p ON a.patientId = p.id
    INNER JOIN users prof ON a.professionalId = prof.id
    LEFT JOIN professional_profiles pp ON prof.id = pp.userId
    INNER JOIN locations l ON a.locationId = l.id
    INNER JOIN specialties s ON a.specialtyId = s.id
    WHERE a.startAt >= ? AND a.startAt <= ?
  `;

  const params: any[] = [startDate, endDate];

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
        email: row.prof_email,
        name: row.prof_name,
        passwordHash: row.prof_passwordHash,
        role: row.prof_role,
        createdAt: row.prof_createdAt,
        updatedAt: row.prof_updatedAt,
      }),
      professional: row.pp_userId ? rowToProfessionalProfile({
        userId: row.pp_userId,
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
      name: row.l_name,
      address: row.l_address,
      phone: row.l_phone,
      createdAt: row.l_createdAt,
      updatedAt: row.l_updatedAt,
    }),
    specialty: rowToSpecialty({
      id: row.s_id,
      name: row.s_name,
      createdAt: row.s_createdAt,
      updatedAt: row.s_updatedAt,
    }),
  }));
}

export async function updateAppointment(data: {
  id: string;
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
    const appointment = await findAppointmentById(data.id);
    if (!appointment) throw new Error('Appointment not found');
    return appointment;
  }

  values.push(data.id);
  await mysql.execute(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`, values);
  const appointment = await findAppointmentById(data.id);
  if (!appointment) throw new Error('Appointment not found');
  return appointment;
}

export async function deleteAppointment(id: string): Promise<void> {
  await mysql.execute('DELETE FROM appointments WHERE id = ?', [id]);
}


// MedicalCoverage and MedicalPlan operations
export async function findAllMedicalCoveragesWithPlans(): Promise<MedicalCoverageWithPlans[]> {
  const [coverageRows] = await mysql.execute('SELECT * FROM medical_coverages ORDER BY name ASC');
  const coverages = coverageRows as any[];

  const results: MedicalCoverageWithPlans[] = [];

  for (const coverage of coverages) {
    const [planRows] = await mysql.execute('SELECT * FROM medical_plans WHERE coverageId = ? ORDER BY name ASC', [coverage.id]);
    results.push({
      ...coverage,
      plans: planRows as MedicalPlan[]
    });
  }

  return results;
}

export async function findMedicalCoverageById(id: string): Promise<MedicalCoverageWithPlans | null> {
  const [rows] = await mysql.execute('SELECT * FROM medical_coverages WHERE id = ?', [id]);
  const result = rows as any[];
  if (result.length === 0) return null;

  const coverage = result[0];
  const [planRows] = await mysql.execute('SELECT * FROM medical_plans WHERE coverageId = ? ORDER BY name ASC', [id]);

  return {
    ...coverage,
    plans: planRows as MedicalPlan[]
  };
}

export async function createMedicalCoverage(data: { id: string, name: string, plans: { id: string, name: string }[] }): Promise<MedicalCoverageWithPlans> {
  await mysql.execute('INSERT INTO medical_coverages (id, name) VALUES (?, ?)', [data.id, data.name]);

  for (const plan of data.plans) {
    await mysql.execute('INSERT INTO medical_plans (id, coverageId, name) VALUES (?, ?, ?)', [plan.id, data.id, plan.name]);
  }

  const result = await findMedicalCoverageById(data.id);
  if (!result) throw new Error('Failed to create medical coverage');
  return result;
}

export async function updateMedicalCoverage(id: string, name: string, plans: { id?: string, name: string }[]): Promise<MedicalCoverageWithPlans> {
  await mysql.execute('UPDATE medical_coverages SET name = ? WHERE id = ?', [name, id]);

  // Simple approach: get existing plans, compare and update/delete/insert
  const [existingPlanRows] = await mysql.execute('SELECT id FROM medical_plans WHERE coverageId = ?', [id]);
  const existingPlanIds = (existingPlanRows as any[]).map(row => row.id);

  const currentPlanIds = plans.map(p => p.id).filter(Boolean) as string[];

  // Delete plans not in the new list
  const toDelete = existingPlanIds.filter(id => !currentPlanIds.includes(id));
  if (toDelete.length > 0) {
    await mysql.execute(`DELETE FROM medical_plans WHERE id IN (${toDelete.map(() => '?').join(',')})`, toDelete);
  }

  // Update or insert plans
  for (const plan of plans) {
    if (plan.id && existingPlanIds.includes(plan.id)) {
      await mysql.execute('UPDATE medical_plans SET name = ? WHERE id = ?', [plan.name, plan.id]);
    } else {
      const newPlanId = plan.id || crypto.randomUUID();
      await mysql.execute('INSERT INTO medical_plans (id, coverageId, name) VALUES (?, ?, ?)', [newPlanId, id, plan.name]);
    }
  }

  const result = await findMedicalCoverageById(id);
  if (!result) throw new Error('Failed to update medical coverage');
  return result;
}

export async function deleteMedicalCoverage(id: string): Promise<void> {
  await mysql.execute('DELETE FROM medical_coverages WHERE id = ?', [id]);
}
