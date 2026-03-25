/**
 * Genera iconos PWA en public/ (requiere: npm install sharp --save-dev)
 * Ejecutar: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#g)"/>
  <text x="256" y="340" text-anchor="middle" font-family="system-ui,sans-serif" font-size="220" font-weight="700" fill="#ffffff">T</text>
</svg>`;

const buf = Buffer.from(svg);

await sharp(buf).resize(192, 192).png().toFile(join(publicDir, "icon-192x192.png"));
await sharp(buf).resize(512, 512).png().toFile(join(publicDir, "icon-512x512.png"));

console.log("OK: public/icon-192x192.png, public/icon-512x512.png");
