// Mirror every .css file from src/ into dist/, preserving the directory
// structure. `tsc` emits the JS tree but leaves `import styles from
// "./button.module.css"` untouched, so the stylesheet must exist as a sibling
// of the emitted module. Next.js consumers process the modules from source;
// non-Next.js consumers (Storybook, the desktop shell) import these copies.
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SRC = 'src';
const DIST = 'dist';

function mirror(dir) {
  for (const entry of readdirSync(dir)) {
    const from = join(dir, entry);
    if (statSync(from).isDirectory()) {
      mirror(from);
      continue;
    }
    if (!from.endsWith('.css')) continue;
    const to = join(DIST, from.slice(SRC.length + 1));
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
  }
}

mirror(SRC);
