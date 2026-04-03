/** Solo constantes (sin mysql). Importar desde cliente; no usar `tenant-expenses.ts` en el browser. */

export const EXPENSE_CATEGORY_SUGGESTIONS = [
  "Alquiler",
  "Expensas",
  "Sueldos",
  "Insumos",
  "Luz",
  "Agua",
  "Electricidad",
  "Internet",
  "Equipamiento",
  "Marketing",
  "otros",
] as const;

export type ExpenseCategorySuggestion = (typeof EXPENSE_CATEGORY_SUGGESTIONS)[number];
