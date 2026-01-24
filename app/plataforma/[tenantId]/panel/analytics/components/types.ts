export interface AnalyticsStats {
  totalPatients: number;
  daily: Array<{ date: string; count: number }>;
  weekly: Array<{ year: number; week: number; count: number }>;
  monthly: Array<{ year: number; month: number; count: number }>;
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
