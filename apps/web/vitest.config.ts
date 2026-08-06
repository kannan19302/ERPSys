import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**", "**/.next/**"],

    // @unerp/ui ships CSS modules beside its compiled components. Vitest
    // externalises node_modules by default, so Node `require()`d those
    // stylesheets and threw `SyntaxError: Unexpected token '.'` on the first
    // `.class` selector — the same failure the Next config solves with
    // transpilePackages. Inlining routes the design system through Vite's
    // transform pipeline, which understands CSS.
    server: {
      deps: {
        // Regex, not bare names: the design system is reached through several
        // specifiers (@unerp/ui, @unerp/ui/theme, @unerp/ui/notifications) and
        // an exact-name match misses every subpath, leaving them externalised
        // and back in Node's hands.
        inline: [/@unerp\//],
      },
    },

    // Process CSS rather than discarding it, so a component that reads
    // `styles.button` gets a class name instead of undefined.
    css: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
