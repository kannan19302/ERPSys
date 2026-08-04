"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  BookOpen,
  Sparkles,
  Layout,
  Palette,
} from "lucide-react";
import { TenantHeader, TenantFooter } from "./TenantHeaderFooter";

export interface TenantStarterHomeProps {
  settings?: any;
}

export function TenantStarterHome({ settings }: TenantStarterHomeProps) {
  const siteName = settings?.siteName || "Enterprise Store";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
      }}
    >
      <TenantHeader settings={settings} />

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <section
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            padding: "6rem 1.5rem 5rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.15), transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.4rem 1rem",
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#93c5fd",
                marginBottom: "1.5rem",
              }}
            >
              <Sparkles size={16} />
              <span>Studio-Powered Tenant Web Portal</span>
            </div>

            <h1
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                margin: "0 0 1.5rem 0",
                color: "#ffffff",
              }}
            >
              Welcome to <span style={{ color: "#60a5fa" }}>{siteName}</span>
            </h1>

            <p
              style={{
                fontSize: "1.25rem",
                color: "#94a3b8",
                maxWidth: "680px",
                margin: "0 auto 2.5rem",
                lineHeight: 1.6,
              }}
            >
              Your customizable enterprise storefront, blog, and customer
              portal. Edit layouts, banners, product showcases, and content
              blocks directly in Builder Studio.
            </p>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/shop"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.875rem 1.75rem",
                  borderRadius: "10px",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "1rem",
                  textDecoration: "none",
                  boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.4)",
                  transition: "transform 0.15s ease, background 0.15s ease",
                }}
              >
                <ShoppingBag size={18} />
                <span>Explore Storefront</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/apps/builder/web/pages"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.875rem 1.75rem",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "1rem",
                  textDecoration: "none",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  transition: "background 0.15s ease",
                }}
              >
                <Layout size={18} />
                <span>Open Page Builder</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "5rem 1.5rem",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "#0f172a",
                margin: "0 0 0.75rem 0",
              }}
            >
              Everything Ready for Your Enterprise
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: "1.05rem",
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >
              Build dynamic landing pages, launch e-commerce products, publish
              news, and manage your brand portal with zero coding required.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "2rem",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "2rem",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <ShoppingBag size={24} />
              </div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: "0 0 0.5rem 0",
                }}
              >
                E-Commerce Storefront
              </h3>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  margin: "0 0 1.25rem 0",
                }}
              >
                Showcase product catalogs, handle online shopping carts, and
                link orders directly with ERP Inventory & Sales.
              </p>
              <Link
                href="/shop"
                style={{
                  color: "#2563eb",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                View Shop <ArrowRight size={14} />
              </Link>
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "2rem",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "#f0fdf4",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <BookOpen size={24} />
              </div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: "0 0 0.5rem 0",
                }}
              >
                Blogs & News
              </h3>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  margin: "0 0 1.25rem 0",
                }}
              >
                Publish corporate announcements, articles, customer stories, and
                SEO-optimized blog content effortlessly.
              </p>
              <Link
                href="/blog"
                style={{
                  color: "#16a34a",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                Browse Blog <ArrowRight size={14} />
              </Link>
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "2rem",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "#faf5ff",
                  color: "#9333ea",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <Palette size={24} />
              </div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: "0 0 0.5rem 0",
                }}
              >
                No-Code Page Studio
              </h3>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  margin: "0 0 1.25rem 0",
                }}
              >
                Customize colors, fonts, drag-and-drop block sections, hero
                banners, and form builders visually in real time.
              </p>
              <Link
                href="/apps/builder/web/pages"
                style={{
                  color: "#9333ea",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                Edit Pages <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <TenantFooter settings={settings} />
    </div>
  );
}
