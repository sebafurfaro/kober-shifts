import { useTenantSettingsStore } from "./tenant-settings-store";

/**
 * Hook to get tenant-specific labels for patients and professionals
 * Returns default values if translations are not loaded
 */
export function useTenantLabels() {
  const translations = useTenantSettingsStore((state) => state.translations);
  
  return {
    patientLabel: translations.patientLabel || "Pacientes",
    professionalLabel: translations.professionalLabel || "Profesionales",
  };
}

/**
 * Utility function to get patient label (for use in server components or outside React)
 * Note: This will return default values. For client components, use useTenantLabels hook.
 */
export function getPatientLabel(): string {
  return "Pacientes"; // Default, will be overridden by store in client components
}

/**
 * Utility function to get professional label (for use in server components or outside React)
 * Note: This will return default values. For client components, use useTenantLabels hook.
 */
export function getProfessionalLabel(): string {
  return "Profesionales"; // Default, will be overridden by store in client components
}
