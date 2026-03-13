import coberturasData from "./coberturas.json";

/** Lista de coberturas médicas predefinidas (titulo + planes). Fuente única para API y sync. */
export const coberturas = coberturasData as Array<{ title?: string; plans?: Array<{ name: string }> }>;
