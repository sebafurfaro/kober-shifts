/**
 * Feriados nacionales AR (Argentina Datos). Solo usar en servidor / Route Handlers.
 */

const cache = new Map<number, { at: number; ymds: Set<string> }>();
const TTL_MS = 24 * 60 * 60 * 1000;

export async function fetchArgentinaNationalHolidayYmdsForYear(year: number): Promise<Set<string>> {
  const now = Date.now();
  const hit = cache.get(year);
  if (hit && now - hit.at < TTL_MS) return hit.ymds;

  const ymds = new Set<string>();
  try {
    const res = await fetch(`https://api.argentinadatos.com/v1/feriados/${year}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const data = await res.json().catch(() => []);
      if (Array.isArray(data)) {
        for (const row of data as Array<{ fecha?: string }>) {
          if (row?.fecha && /^\d{4}-\d{2}-\d{2}$/.test(row.fecha)) {
            ymds.add(row.fecha);
          }
        }
      }
    }
  } catch {
    // fail open: no bloquear por feriado si la API falla
  }
  cache.set(year, { at: now, ymds });
  return ymds;
}
