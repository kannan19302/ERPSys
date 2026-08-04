import type { Metadata } from "next";
import { Inter } from "next/font/google";

export const dynamic = "force-dynamic";
import "@unerp/ui/styles";
import { ThemeProvider, ToastProvider } from "@unerp/ui";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "UniERP Developer Studio",
    template: "%s | UniERP Developer Studio",
  },
  description:
    "App Studio, Workflow Designer, Form Builder, Report Builder, and the Extension SDK.",
};

/**
 * Root layout for the Developer Studio.
 *
 * The platform split moved the builder routes into this app but never brought a
 * root layout with them, so `next build` failed outright with "page.tsx doesn't
 * have a root layout" — the app could not be built at all. It mirrors the web
 * app's shell (design-system styles, theme, toasts) minus the tenant-app
 * providers (query client, app framework), which the studio does not use.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={inter.variable}
      data-theme="light"
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider defaultSetting="light">
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
