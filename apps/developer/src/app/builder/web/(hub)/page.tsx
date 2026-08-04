"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@unerp/ui";
import {
  Globe,
  Monitor,
  ChevronRight,
  FileText,
  Image,
  Code2,
  Layers,
  SearchCheck,
  Database,
  Inbox,
  ShoppingCart,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { RouteGuard, useApiClient } from "@unerp/framework";
interface WebStats {
  publishedPages: number;
  blogPosts: number;
  assets: number;
  templates: number;
  pages: number;
  seo: number;
  menus: number;
}

export default function WebBuilderPage() {
  const client = useApiClient();
  const router = useRouter();
  const [stats, setStats] = useState<WebStats>({
    publishedPages: 0,
    blogPosts: 0,
    assets: 0,
    templates: 0,
    pages: 0,
    seo: 0,
    menus: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    client
      .get<{ web?: WebStats }>("/builder/stats")
      .then((data) => {
        if (data.web) setStats(data.web);
      })
      .catch(console.error);
  }, [client]);

  return (
    <RouteGuard permission="builder.web.read">
      <div className={styles.s1}>
        {/* Header */}
        <PageHeader
          title="Web Studio"
          description="Dynamic CMS editor for managing public-facing website content in real time"
          actions={
            <button
              className="ui-btn ui-btn-secondary"
              onClick={() => router.push("/builder")}
            >
              ← Studio
            </button>
          }
        />

        {/* Stats */}
        <div className={styles.s2}>
          {[
            {
              label: "Published Pages",
              value: stats.publishedPages.toString(),
              icon: Globe,
              color: "#7c3aed",
            },
            {
              label: "Blog Posts",
              value: stats.blogPosts.toString(),
              icon: FileText,
              color: "var(--color-primary)",
            },
            {
              label: "Media Assets",
              value: stats.assets.toString(),
              icon: Image,
              color: "#059669",
            },
            {
              label: "Templates",
              value: stats.templates.toString(),
              icon: Code2,
              color: "#d97706",
            },
          ].map((stat) => (
            <div key={stat.label} className={`ui-card ${styles.s3}`}>
              <div
                style={{ background: `${stat.color}20` }}
                className={styles.s4}
              >
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <div>
                <p className={styles.s5}>{stat.value}</p>
                <p className="ui-text-xs-muted m-0">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recharts Traffic Analytics Chart */}
        {mounted && (
          <div className="ui-card p-5">
            <h3 className={styles.s6}>Web traffic & Visitor Trends</h3>
            <div className={styles.s7}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { date: "06/22", visitors: 140, pageviews: 310 },
                    { date: "06/23", visitors: 190, pageviews: 450 },
                    { date: "06/24", visitors: 220, pageviews: 520 },
                    { date: "06/25", visitors: 170, pageviews: 380 },
                    { date: "06/26", visitors: 280, pageviews: 610 },
                    { date: "06/27", visitors: 310, pageviews: 730 },
                    { date: "06/28", visitors: 420, pageviews: 980 },
                  ]}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorVisitors"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="var(--color-text-secondary)"
                    className={styles.s8}
                  />
                  <YAxis
                    stroke="var(--color-text-secondary)"
                    className={styles.s8}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    name="Unique Visitors"
                    stroke="#7c3aed"
                    fillOpacity={1}
                    fill="url(#colorVisitors)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {/* Stats */}
        <div className={styles.s2}>
          <div className={`ui-card ${styles.s3}`}>
            <div style={{ background: "#7c3aed20" }} className={styles.s4}>
              <Globe size={20} style={{ color: "#7c3aed" }} />
            </div>
            <div>
              <p className={styles.s5}>{stats.publishedPages}</p>
              <p className="ui-text-xs-muted m-0">Published Pages</p>
            </div>
          </div>
          <div className={`ui-card ${styles.s3}`}>
            <div
              style={{ background: "var(--color-primary-bg)" }}
              className={styles.s4}
            >
              <FileText size={20} style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <p className={styles.s5}>{stats.blogPosts}</p>
              <p className="ui-text-xs-muted m-0">Blog Posts</p>
            </div>
          </div>
          <div className={`ui-card ${styles.s3}`}>
            <div style={{ background: "#05966920" }} className={styles.s4}>
              <Image size={20} style={{ color: "#059669" }} />
            </div>
            <div>
              <p className={styles.s5}>{stats.assets}</p>
              <p className="ui-text-xs-muted m-0">Media Assets</p>
            </div>
          </div>
          <div className={`ui-card ${styles.s3}`}>
            <div style={{ background: "#d9770620" }} className={styles.s4}>
              <Code2 size={20} style={{ color: "#d97706" }} />
            </div>
            <div>
              <p className={styles.s5}>{stats.templates}</p>
              <p className="ui-text-xs-muted m-0">Templates</p>
            </div>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className={styles.s9}>
          {[
            {
              id: "collections",
              title: "CMS Collections",
              description:
                "Model dynamic content — products, projects, team, blog",
              color: "#6366f1",
              href: "/builder/web/collections",
              count: "Dynamic content",
            },
            {
              id: "pages",
              title: "Pages",
              description:
                "Visual builder with 18+ blocks, CMS binding & publish",
              color: "#7c3aed",
              href: "/builder/web/pages",
              count: `${stats.pages} pages`,
            },
            {
              id: "orders",
              title: "Orders",
              description: "Storefront orders, revenue and fulfillment",
              color: "#10b981",
              href: "/builder/web/orders",
              count: "E-commerce",
            },
            {
              id: "submissions",
              title: "Form Submissions",
              description: "Leads, contacts and newsletter sign-ups inbox",
              color: "#0891b2",
              href: "/builder/web/submissions",
              count: "Inbox",
            },
            {
              id: "blog",
              title: "Blog Posts",
              description: "Write, edit, and publish blog articles",
              color: "var(--color-primary)",
              href: "/builder/web/blog",
              count: `${stats.blogPosts} posts`,
            },
            {
              id: "assets",
              title: "Asset Manager",
              description: "Upload and organize images, videos, documents",
              color: "#059669",
              href: "/builder/web/assets",
              count: `${stats.assets} files`,
            },
            {
              id: "templates",
              title: "Templates",
              description: "Manage reusable page and email templates",
              color: "#d97706",
              href: "/builder/web/templates",
              count: `${stats.templates} templates`,
            },
            {
              id: "menus",
              title: "Navigation Menus",
              description: "Configure header, footer, and sidebar menus",
              color: "#0891b2",
              href: "/builder/web/menus",
              count: `${stats.menus} menus`,
            },
            {
              id: "seo",
              title: "SEO Settings",
              description: "Manage page metadata and search visibility",
              color: "#7c3aed",
              href: "/builder/web/seo",
              count: `${stats.seo} entries`,
            },
          ].map((item) => (
            <div
              key={item.title}
              className={`ui-card ${styles.s10} ${styles.accessCard}`}
              style={{ "--accent": item.color } as React.CSSProperties}
              onClick={() => router.push(item.href)}
            >
              <div className="ui-flex ui-items-center ui-justify-between mb-3">
                <div
                  style={{ background: `${item.color}20` }}
                  className={styles.s4}
                >
                  {item.id === "collections" && (
                    <Database size={22} style={{ color: item.color }} />
                  )}
                  {item.id === "pages" && (
                    <Monitor size={22} style={{ color: item.color }} />
                  )}
                  {item.id === "orders" && (
                    <ShoppingCart size={22} style={{ color: item.color }} />
                  )}
                  {item.id === "submissions" && (
                    <Inbox size={22} style={{ color: item.color }} />
                  )}
                  {item.id === "blog" && (
                    <FileText size={22} style={{ color: item.color }} />
                  )}
                  {item.id === "assets" && (
                    <Image size={22} style={{ color: item.color }} />
                  )}
                  {item.id === "templates" && (
                    <Code2 size={22} style={{ color: item.color }} />
                  )}
                  {item.id === "menus" && (
                    <Layers size={22} style={{ color: item.color }} />
                  )}
                  {item.id === "seo" && (
                    <SearchCheck size={22} style={{ color: item.color }} />
                  )}
                </div>
                <span className={`ui-badge ${styles.s11}`}>{item.count}</span>
              </div>
              <h3 className={styles.s12}>{item.title}</h3>
              <p className={styles.s13}>{item.description}</p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="ui-card p-4">
          <h3 className={styles.s15}>Recent Website Changes</h3>
          <div className="ui-stack-1">
            <div className={styles.s16}>
              Recent changes will appear after website content is created or
              updated.
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
