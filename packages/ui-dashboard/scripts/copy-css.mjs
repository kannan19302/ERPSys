// Copy externalized CSS modules next to the bundle — the dist output
// imports them as siblings (e.g. "./multi-page-dashboard.module.css").
import { copyFileSync, readdirSync } from 'node:fs';

for (const f of readdirSync('src')) {
  if (f.endsWith('.module.css')) copyFileSync(`src/${f}`, `dist/${f}`);
}
