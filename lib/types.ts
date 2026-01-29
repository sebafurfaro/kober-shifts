// Tipos que reemplazan los de Prisma

export enum Role {
  PATIENT = 'PATIENT',
  PROFESSIONAL = 'PROFESSIONAL',
  ADMIN = 'ADMIN',
}

export enum AppointmentStatus {
  REQUESTED = 'REQUESTED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  ATTENDED = 'ATTENDED',
}

export enum Gender {
  MASCULINO = 'Masculino',
  FEMENINO = 'Femenino',
  NO_BINARIO = 'No binario',
}

export interface Tenant {
  id: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
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
  gender?: Gender | null;
  nationality?: string | null;
  googleId?: string | null;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface Specialty {
  id: string;
  tenantId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
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
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfessionalProfile {
  userId: string;
  tenantId: string;
  specialtyId: string;
  isActive: boolean;
  googleCalendarId: string | null;
  color: string | null;
  licenseNumber: string | null;
  medicalCoverages: string[] | null;
  availabilityConfig: {
    days: {
      [key: number]: { // 0-6
        slots: Array<{
          id: string;
          startTime: string;
          endTime: string;
          fromDate: string;
          toDate: string | null;
          repeat: 'weekly' | 'biweekly' | 'monthly';
        }>;
      };
    };
    holidays?: Array<{
      id: string;
      startDate: string;
      endDate: string;
      description?: string;
    }>;
  } | null;
  availableDays: number[] | null; // Legacy 0=Domingo, 1=Lunes, ..., 6=Sábado
  availableHours: { start: string; end: string } | null; // Legacy Formato "HH:mm"
  createdAt: Date;
  updatedAt: Date;
}

export interface GoogleOAuthToken {
  id: string;
  tenantId: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  scope: string | null;
  tokenType: string | null;
  expiryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  tenantId: string;
  status: AppointmentStatus;
  startAt: Date;
  endAt: Date;
  patientId: string;
  professionalId: string;
  locationId: string;
  specialtyId: string;
  googleEventId: string | null;
  notes: string | null;
  cancellationReason: string | null;
  cancelledBy: Role | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalCoverage {
  id: string;
  tenantId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalPlan {
  id: string;
  tenantId: string;
  coverageId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalCoverageWithPlans extends MedicalCoverage {
  plans: MedicalPlan[];
}
