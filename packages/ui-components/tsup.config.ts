import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  // CSS Modules are externalized (kept out of the JS bundle via the `/\.css$/`
  // external) and copied verbatim next to the bundle by `scripts/copy-css.mjs`
  // on success, so the dist output can import them as siblings
  // (e.g. `./button.module.css`). Next.js consumers using transpilePackages
  // process the modules from source; non-Next.js consumers (Storybook, etc.)
  // import the emitted sibling `.module.css` files.
  external: ['react', 'react-dom', /\.css$/],
  onSuccess: 'node scripts/copy-css.mjs',
  esbuildOptions(opts) {
    opts.jsx = 'automatic';
  },
});
