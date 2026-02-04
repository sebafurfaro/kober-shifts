export interface AnalyticsStats {
  totalPatients: number;
  daily: Array<{ date: string; count: number }>;
  weekly: Array<{ year: number; week: number; count: number }>;
  monthly: Array<{ year: number; month: number; count: number }>;
}

export interface AnalyticsMetrics {
  year: number;
  month: number;
  revenue: { totalMonth: number; totalYear: number; byMonth: Array<{ year: number; month: number; total: number }> };
  appointments: { totalMonth: number; totalYear: number; byMonth: Array<{ year: number; month: number; count: number }> };
  patients: { totalMonth: number; totalYear: number; byMonth: Array<{ year: number; month: number; count: number }> };
  cancellations: { totalMonth: number; totalYear: number; byMonth: Array<{ year: number; month: number; count: number }> };
  reminders?: { assigned: number; used: number };
}

export interface Patient {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  totalAppointments: number;
  cancelledAppointments: number;
}

export interface PatientsResponse {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
