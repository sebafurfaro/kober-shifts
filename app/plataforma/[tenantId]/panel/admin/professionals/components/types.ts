export interface Specialty {
    id: string;
    name: string;
}

export interface Slot {
    id: string;
    startTime: string;
    endTime: string;
    fromDate: string;
    toDate: string | null;
    repeat: "weekly" | "biweekly" | "monthly";
}

export interface AvailabilityDay {
    slots: Slot[];
}

export interface Holiday {
    id: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    description?: string;
}

export interface AvailabilityConfig {
    days: {
        [key: number]: AvailabilityDay;
    };
    holidays?: Holiday[];
}

export interface SelectedPlan {
    planId: string;
    active: boolean;
}

export interface SelectedCoverage {
    coverageId: string;
    plans: SelectedPlan[];
}

export interface ProfessionalFormData {
    name: string;
    email: string;
    dni?: string;
    phone: string;
    licenseNumber: string;
    tempPassword?: string;
    specialtyIds: string[];
    medicalCoverages: SelectedCoverage[];
    color: string;
    availabilityConfig: AvailabilityConfig;
    holidays?: Holiday[];
}

export const INITIAL_AVAILABILITY: AvailabilityConfig = {
    days: {
        1: { slots: [] },
        2: { slots: [] },
        3: { slots: [] },
        4: { slots: [] },
        5: { slots: [] },
        6: { slots: [] },
        0: { slots: [] },
    },
    holidays: [],
};
