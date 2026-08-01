import type { Metadata } from "next";
import { Inter } from "next/font/google";

export const dynamic = "force-dynamic";
import "@unerp/ui/styles";
import { ThemeProvider, ToastProvider } from "@unerp/ui";
import { CommandPalette } from "@/components/CommandPalette";
import { QueryProvider } from "@/lib/query-provider";
import { AppFrameworkProvider } from "@/lib/framework-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "UniERP — Universal Enterprise Resource Planning",
    template: "%s | UniERP",
  },
  description:
    "A fully-packed, composable, industry-agnostic Enterprise Resource Planning system.",
  keywords: ["ERP", "enterprise", "resource planning", "business management"],
};

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
          <QueryProvider>
            <AppFrameworkProvider>
              <ToastProvider>
                <CommandPalette />
                {children}
              </ToastProvider>
            </AppFrameworkProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
