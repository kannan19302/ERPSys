// @ts-nocheck
import React from "react";
import { BLOCK_REGISTRY } from "./blocks/registry";
import { TenantHeader, TenantFooter } from "../site/TenantHeaderFooter";

export function PublicPageRenderer({
  page,
  settings,
  hideHeaderFooter,
}: {
  page: any;
  settings: any;
  hideHeaderFooter?: boolean;
}) {
  if (!page) {
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        <h1>Page not found</h1>
      </div>
    );
  }

  let sections: any[] = [];
  try {
    if (typeof page.sections === "string") {
      sections = JSON.parse(page.sections);
    } else if (Array.isArray(page.sections)) {
      sections = page.sections;
    } else if (page.sections?.items) {
      sections = page.sections.items;
    }
  } catch (e) {
    sections = [];
  }

  const themeTokens = settings?.themeTokens
    ? typeof settings.themeTokens === "string"
      ? JSON.parse(settings.themeTokens)
      : settings.themeTokens
    : null;

  // Convert tokens to CSS custom properties string
  let cssVars = "";
  if (themeTokens?.colors) {
    Object.entries(themeTokens.colors).forEach(([key, value]) => {
      cssVars += `--color-${key}: ${value};\n`;
    });
  }
  if (themeTokens?.fonts) {
    cssVars += `--font-heading: ${themeTokens.fonts.heading};\n`;
    cssVars += `--font-body: ${themeTokens.fonts.body};\n`;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-background, #ffffff)",
        color: "var(--color-text, #111111)",
        fontFamily: "var(--font-body, sans-serif)",
      }}
    >
      <style
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `:root { ${cssVars} } \n ${settings?.globalCss || ""}`,
        }}
      />
      {!hideHeaderFooter && <TenantHeader settings={settings} />}
      <main style={{ flex: 1 }}>
        {sections.map((section) => {
          const BlockComponent = (BLOCK_REGISTRY[section.type] ||
            BLOCK_REGISTRY["text"])!;
          return (
            <div key={section.id}>
              <BlockComponent {...(section.content || {})} />
            </div>
          );
        })}
      </main>
      {!hideHeaderFooter && <TenantFooter settings={settings} />}
    </div>
  );
}
