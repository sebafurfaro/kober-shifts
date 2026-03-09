/**
 * Revisa el estado de settings de un tenant en MongoDB (tenant_settings).
 * Uso: node scripts/check-tenant-settings.mjs [tenantId]
 * Ejemplo: node scripts/check-tenant-settings.mjs acabogados
 * Requiere MONGODB_URI en el entorno (o .env cargado con --env-file=.env).
 */

import { MongoClient } from "mongodb";

const tenantId = process.argv[2] || "acabogados";
const uri =
  process.env.MONGODB_URI ||
  (process.env.NODE_ENV !== "production" ? "mongodb://127.0.0.1:27020/kober_shifts" : null);

if (!uri) {
  console.error("Falta MONGODB_URI. Ejecutá con: node --env-file=.env scripts/check-tenant-settings.mjs acabogados");
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection("tenant_settings");
    const doc = await collection.findOne({ tenantId });

    if (!doc) {
      console.log(`Tenant "${tenantId}": no hay documento en tenant_settings (se usan valores por defecto).`);
      console.log("Valor por defecto de manualTurnConfirmation: false");
      return;
    }

    const settings = doc.settings && typeof doc.settings === "object" ? doc.settings : {};
    const manualTurnConfirmation = settings.manualTurnConfirmation === true;

    console.log(`Tenant: ${tenantId}`);
    console.log("---");
    console.log("Confirmación manual de turnos (manualTurnConfirmation):", manualTurnConfirmation);
    console.log("  → Si true: los turnos nuevos (sin seña) quedan en REQUESTED hasta confirmación.");
    console.log("  → Si false: los turnos nuevos (sin seña) se confirman automáticamente (CONFIRMED).");
    console.log("---");
    if (Object.keys(settings).length > 0) {
      console.log("Resto de settings guardados:", JSON.stringify(settings, null, 2));
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
