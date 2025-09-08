import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifestPath = path.join(__dirname, '..', '.next', 'routes-manifest.json');

try {
  if (!fs.existsSync(manifestPath)) {
    console.log('[fix-routes-manifest] No routes-manifest.json found, skipping.');
    process.exit(0);
  }

  const raw = fs.readFileSync(manifestPath, 'utf8');
  const json = JSON.parse(raw);

  // Ensure dataRoutes is an array for Next.js startup compatibility.
  if (!Array.isArray(json.dataRoutes)) {
    json.dataRoutes = [];
  }

  fs.writeFileSync(manifestPath, JSON.stringify(json, null, 2));
  console.log('[fix-routes-manifest] Ensured dataRoutes array in routes-manifest.json');
} catch (err) {
  console.warn('[fix-routes-manifest] Failed to patch routes-manifest.json:', err?.message);
  // Do not fail the build; this is a best-effort fix.
}
