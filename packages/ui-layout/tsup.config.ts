import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  // CSS Modules are externalized and copied verbatim next to the bundle by
  // scripts/copy-css.mjs, matching the pattern in @unerp/ui-components.
  external: ["react", "react-dom", /\.css$/],
  onSuccess: "node scripts/copy-css.mjs",
  esbuildOptions(opts) {
    opts.jsx = "automatic";
  },
});
