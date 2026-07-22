"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, KPICard, Badge, EmptyState } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import {
  Cpu,
  Globe,
  Store,
  Server,
  FileCode2,
  Workflow,
  BarChart3,
  Database,
  Image as ImageIcon,
  FileText,
  History,
  Activity,
  Shield,
  GitFork,
  Sparkles,
  PlusCircle,
  ChevronRight,
  ExternalLink,
  Search,
  Layers,
  Wrench,
} from "lucide-react";
import {
  BuilderTabLayout,
  BUILDER_TABS,
} from "@/components/builder/BuilderTabLayout";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  Cell,
} from "recharts";

interface RecentItem {
  id: string;
  name: string;
  type: string;
  path: string;
  status: string;
  updatedAt: string;
}

function formatTimeAgo(dateString: string): string {
  if (!dateString) return "unknown";
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval >= 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval >= 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval >= 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval >= 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + " mins ago";
  return "just now";
}

const PILLARS = [
  {
    id: "build",
    title: "Build",
    subtitle: "App Studio",
    desc: "Create custom ERP modules, forms, workflows, dashboards and business logic — no code required.",
    icon: Cpu,
    color: "var(--color-primary)",
    href: "/builder/erp",
  },
  {
    id: "web",
    title: "Web Studio",
    subtitle: "Sites & CMS",
    desc: "Design multi-site websites, manage collections, blog, assets, SEO and commerce.",
    icon: Globe,
    color: "#7c3aed",
    href: "/builder/web",
  },
  {
    id: "marketplace",
    title: "Marketplace",
    subtitle: "Apps & vendors",
    desc: "Browse and install apps from the store, or publish your own through the developer portal.",
    icon: Store,
    color: "#059669",
    href: "/apps/store",
  },
  {
    id: "manage",
    title: "Manage",
    subtitle: "Governance & ops",
    desc: "Releases, environments, run logs and access control across everything you build.",
    icon: Server,
    color: "#d97706",
    href: "/builder/manage",
  },
];

const QUICK_ACTIONS = [
  {
    label: "New App",
    icon: Cpu,
    href: "/builder/erp/modules?new=1",
    color: "var(--color-primary)",
  },
  {
    label: "New Form",
    icon: FileCode2,
    href: "/builder/erp/forms?new=1",
    color: "var(--color-primary)",
  },
  {
    label: "New Workflow",
    icon: Workflow,
    href: "/builder/erp/workflows/new",
    color: "#7c3aed",
  },
  {
    label: "New Dashboard",
    icon: BarChart3,
    href: "/builder/erp/dashboards/new",
    color: "#059669",
  },
  {
    label: "New Site",
    icon: Globe,
    href: "/builder/web/sites?new=1",
    color: "#7c3aed",
  },
  {
    label: "New Collection",
    icon: Database,
    href: "/builder/web/collections?new=1",
    color: "#7c3aed",
  },
  {
    label: "Upload Asset",
    icon: ImageIcon,
    href: "/builder/web/assets?new=1",
    color: "#d97706",
  },
  {
    label: "New Template",
    icon: FileText,
    href: "/builder/web/templates?new=1",
    color: "#d97706",
  },
];

const MANAGE_SHORTCUTS = [
  { label: "Releases", icon: History, href: "/builder/manage/releases" },
  {
    label: "Environments",
    icon: GitFork,
    href: "/builder/manage/environments",
  },
  { label: "Run Logs", icon: Activity, href: "/builder/manage/logs" },
  { label: "Access Control", icon: Shield, href: "/builder/manage/access" },
];

function StudioHomeContent() {
  const client = useApiClient();
  const router = useRouter();
  const [aiPrompt, setAiPrompt] = useState("");
  const [stats, setStats] = useState({
    erp: { forms: 0, workflows: 0, dashboards: 0, modules: 0 },
    web: { pages: 0, blogPosts: 0, assets: 0, templates: 0 },
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchStats = async () => {
      try {
        const [data, recentItems] = await Promise.all([
          client.get<any>("/builder/stats"),
          client.get<RecentItem[]>("/builder/recent-items"),
        ]);
        setStats({
          erp: {
            forms: data.erp?.forms || 0,
            workflows: data.erp?.workflows || 0,
            dashboards: data.erp?.dashboards || 0,
            modules: data.erp?.modules || 0,
          },
          web: {
            pages: data.web?.pages || 0,
            blogPosts: data.web?.blogPosts || 0,
            assets: data.web?.assets || 0,
            templates: data.web?.templates || 0,
          },
        });
        setRecentItems(recentItems || []);
      } catch {
        /* fallback to empty state */
      }
    };
    fetchStats();
  }, [client]);

  const totalApps = stats.erp.modules;
  const totalArtifacts =
    stats.erp.forms + stats.erp.workflows + stats.erp.dashboards;
  const totalWebContent =
    stats.web.pages +
    stats.web.blogPosts +
    stats.web.assets +
    stats.web.templates;

  const openCommandPalette = () =>
    window.dispatchEvent(new CustomEvent("studio:command-palette"));

  const [generating, setGenerating] = useState(false);

  const startWithAI = async () => {
    const q = aiPrompt.trim();
    if (!q) return;
    setGenerating(true);
    try {
      const data = await client.post<{ id: string }>(
        "/builder/modules/generate",
        { prompt: q },
      );
      router.push(`/builder/erp/apps/${data.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <BuilderTabLayout
      tabs={BUILDER_TABS}
      moduleId="builder"
      moduleLabel="Builder Studio"
      moduleIcon={Wrench}
      moduleDescription="No-Code app builder, form designer, and schema customizer"
    >
      <div className="p-6">
        <PageHeader
          title="Studio"
          description="Build apps, forms, workflows, websites and more — the unified low-code platform for UniERP."
          actions={
            <button
              className="ui-btn ui-btn-secondary"
              onClick={openCommandPalette}
            >
              <Search size={15} />
              <span>Search</span>
              <kbd className={styles.s1}>Ctrl K</kbd>
            </button>
          }
        />

        {/* Start with AI hero */}
        <div className={`ui-card ${styles.s2}`}>
          <div className="ui-card-body">
            <div className={styles.s3}>
              <div className={styles.s4}>
                <Sparkles size={20} className={styles.s5} />
              </div>
              <div>
                <h2 className={styles.s6}>Start with AI</h2>
                <p className="ui-text-xs-muted m-0">
                  Describe what you want to build and Studio will scaffold it
                  for you.
                </p>
              </div>
              <span className={styles.s7}>
                <Badge variant="warning">Preview</Badge>
              </span>
            </div>
            <div className="ui-flex ui-gap-2">
              <input
                className="ui-input"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") startWithAI();
                }}
                disabled={generating}
                placeholder="e.g. A fleet maintenance app with vehicles, service requests and an approval workflow"
              />
              <button
                className={`ui-btn ui-btn-primary ${styles.s8}`}
                onClick={startWithAI}
                disabled={generating || !aiPrompt.trim()}
              >
                <Sparkles size={15} className={generating ? "spin" : ""} />
                <span>{generating ? "Generating App..." : "Generate"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className={`ui-grid-4 ${styles.s2}`}>
          <KPICard
            title="Custom Apps"
            value={totalApps}
            icon={<Cpu size={18} />}
            onClick={() => router.push("/builder/erp/modules")}
          />
          <KPICard
            title="Forms · Workflows · Dashboards"
            value={totalArtifacts}
            icon={<Layers size={18} />}
            color="#7c3aed"
            onClick={() => router.push("/builder/erp")}
          />
          <KPICard
            title="Web Content Items"
            value={totalWebContent}
            icon={<Globe size={18} />}
            color="#059669"
            onClick={() => router.push("/builder/web")}
          />
          <KPICard
            title="Recent Activity"
            value={recentItems.length}
            icon={<Activity size={18} />}
            color="#d97706"
          />
        </div>

        {/* Interactive Charts */}
        {mounted && (
          <div className={styles.s9}>
            <div className="ui-card p-4">
              <h3 className={styles.s10}>
                Build & Web Content Activity Trends
              </h3>
              <div className={styles.s11}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { day: "Mon", builds: 4, webContent: 12 },
                      { day: "Tue", builds: 6, webContent: 19 },
                      { day: "Wed", builds: 5, webContent: 15 },
                      { day: "Thu", builds: 8, webContent: 22 },
                      { day: "Fri", builds: 12, webContent: 32 },
                      { day: "Sat", builds: 3, webContent: 10 },
                      { day: "Sun", builds: 7, webContent: 18 },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorBuilds"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="colorWeb" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#059669"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#059669"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                    />
                    <XAxis
                      dataKey="day"
                      stroke="var(--color-text-secondary)"
                      className={styles.s12}
                    />
                    <YAxis
                      stroke="var(--color-text-secondary)"
                      className={styles.s12}
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
                      dataKey="builds"
                      name="App Builds & Customizations"
                      stroke="var(--color-primary)"
                      fillOpacity={1}
                      fill="url(#colorBuilds)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="webContent"
                      name="Web CMS & Site Pages"
                      stroke="#059669"
                      fillOpacity={1}
                      fill="url(#colorWeb)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ui-card p-4">
              <h3 className={styles.s10}>Resource Distribution</h3>
              <div className={styles.s11}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Apps",
                        count: totalApps,
                        fill: "var(--color-primary)",
                      },
                      {
                        name: "Forms",
                        count: stats.erp.forms,
                        fill: "#7c3aed",
                      },
                      {
                        name: "Flows",
                        count: stats.erp.workflows,
                        fill: "#059669",
                      },
                      {
                        name: "KPIs",
                        count: stats.erp.dashboards,
                        fill: "#d97706",
                      },
                      { name: "Web", count: stats.web.pages, fill: "#2563eb" },
                    ]}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="var(--color-text-secondary)"
                      className={styles.s12}
                    />
                    <YAxis
                      stroke="var(--color-text-secondary)"
                      className={styles.s12}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {[
                        { fill: "var(--color-primary)" },
                        { fill: "#7c3aed" },
                        { fill: "#059669" },
                        { fill: "#d97706" },
                        { fill: "#2563eb" },
                      ].map((item, index) => (
                        <Cell key={`cell-${index}`} fill={item.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Pillars */}
        <div className={`ui-grid-2 ${styles.s2}`}>
          {PILLARS.map((p) => (
            <div
              key={p.id}
              className={`ui-card ${styles.s13}`}
              onClick={() => router.push(p.href)}
            >
              <div className="ui-card-body">
                <div className={styles.s3}>
                  <div style={{ background: p.color }} className={styles.s14}>
                    <p.icon size={22} className={styles.s5} />
                  </div>
                  <div>
                    <h3 className={styles.s15}>{p.title}</h3>
                    <p className="ui-text-xs-muted m-0">{p.subtitle}</p>
                  </div>
                  <ChevronRight size={18} className={styles.s16} />
                </div>
                <p className={styles.s17}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick create */}
        <div className={`ui-card ${styles.s2}`}>
          <div className="ui-card-body">
            <p className={styles.s18}>Quick Create</p>
            <div className="ui-grid-4">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  className={`ui-btn ui-btn-secondary ${styles.s19}`}
                  onClick={() => router.push(action.href)}
                >
                  <PlusCircle size={14} style={{ color: action.color }} />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent items + Manage shortcuts */}
        <div className={styles.s20}>
          <div className="ui-card">
            <div className="ui-card-body">
              <div className={styles.s21}>
                <h3 className={styles.s22}>Recent Items</h3>
                <span className="ui-text-xs-muted">Across all of Studio</span>
              </div>
              {recentItems.length === 0 ? (
                <EmptyState
                  title="Nothing yet"
                  description="Items you create across Studio will appear here."
                />
              ) : (
                <div className="ui-stack-1">
                  {recentItems.map((item) => (
                    <div
                      key={item.id || item.name}
                      onClick={() => router.push(item.path)}
                      className={`${styles.s23} ${styles.recentItem}`}
                    >
                      <div className="ui-hstack-3">
                        <div
                          style={{
                            background:
                              item.type === "erp"
                                ? "var(--color-primary-light)"
                                : "rgba(124,58,237,0.1)",
                          }}
                          className={styles.s24}
                        >
                          {item.type === "erp" ? (
                            <Cpu size={13} className="ui-text-primary" />
                          ) : (
                            <Globe size={13} className={styles.s25} />
                          )}
                        </div>
                        <div>
                          <p className={styles.s26}>{item.name}</p>
                          <p className="ui-text-xs-muted m-0">
                            {item.type === "erp" ? "App Studio" : "Web Studio"}{" "}
                            · {formatTimeAgo(item.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="ui-hstack-2">
                        <Badge
                          variant={
                            item.status === "Published" ? "success" : "warning"
                          }
                        >
                          {item.status}
                        </Badge>
                        <ExternalLink size={13} className="ui-text-tertiary" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="ui-card">
            <div className="ui-card-body">
              <p className={styles.s18}>Manage</p>
              <div className="ui-stack-2">
                {MANAGE_SHORTCUTS.map((s) => (
                  <button
                    key={s.label}
                    className={`ui-btn ui-btn-secondary ${styles.s19}`}
                    onClick={() => router.push(s.href)}
                  >
                    <s.icon size={14} className="ui-text-muted" />
                    <span>{s.label}</span>
                    <ChevronRight size={14} className={styles.s16} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </BuilderTabLayout>
  );
}

export default function StudioHomePage() {
  return (
    <Suspense fallback={<div className={styles.s27}>Loading Studio…</div>}>
      <StudioHomeContent />
    </Suspense>
  );
}
