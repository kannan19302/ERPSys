"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader, Tabs, Spinner, Button, Card } from "@unerp/ui";
import { Activity, Mail, Calendar, Settings, Link2 } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const TAB_KEYS = ["timeline", "settings"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function ActivityCaptureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const client = useApiClient();
  const initialTab = isTabKey(searchParams.get("tab"))
    ? (searchParams.get("tab") as TabKey)
    : "timeline";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get("/crm/activity-capture/settings")
      .then((res: any) => {
        setSettings(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (key: string) => {
    if (!isTabKey(key)) return;
    setActiveTab(key);
    router.replace(`/crm/activity-capture?tab=${key}`, { scroll: false });
  };

  const updateSetting = async (field: string, value: any) => {
    const updated = await client.put("/crm/activity-capture/settings", {
      [field]: value,
    });
    setSettings(updated);
  };

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Activity Capture"
        description="Auto-capture emails, calendar events, and email engagement tracking"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Activity Capture" },
        ]}
      />

      <Tabs
        tabs={[
          {
            key: "timeline",
            label: "Timeline & Unlinked",
            icon: <Activity size={14} />,
          },
          {
            key: "settings",
            label: "Capture Settings",
            icon: <Settings size={14} />,
          },
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      <div style={{ display: activeTab === "timeline" ? "block" : "none" }}>
        <Card>
          <div className="ui-stack-4">
            <div className="ui-flex-h-between">
              <h3 className="ui-text-lg ui-font-semibold">Unlinked Emails</h3>
              <div className="ui-flex-h-2">
                <Link
                  href="/crm/activity-capture/email-tracking"
                  className="ui-btn ui-btn-outline ui-btn-sm"
                >
                  <Mail size={14} /> Email Tracking
                </Link>
                <Link
                  href="/crm/activity-capture/ab-tests"
                  className="ui-btn ui-btn-outline ui-btn-sm"
                >
                  AB Tests
                </Link>
              </div>
            </div>
            <p className="ui-text-muted">
              Use the entity type and ID query params to view a timeline, or
              visit Email Tracking for engagement analytics.
            </p>
          </div>
        </Card>
      </div>

      <div style={{ display: activeTab === "settings" ? "block" : "none" }}>
        <Card className="ui-stack-4">
          <h3 className="ui-text-lg ui-font-semibold">
            Auto-Capture Preferences
          </h3>
          {settings && (
            <div className="ui-grid-2">
              <div className="ui-form-group">
                <label className="ui-label">Capture Emails</label>
                <input
                  type="checkbox"
                  className="ui-checkbox"
                  checked={settings.captureEmails}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateSetting("captureEmails", e.target.checked)
                  }
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Capture Calendar Events</label>
                <input
                  type="checkbox"
                  className="ui-checkbox"
                  checked={settings.captureCalendar}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateSetting("captureCalendar", e.target.checked)
                  }
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Auto-Link to CRM Records</label>
                <input
                  type="checkbox"
                  className="ui-checkbox"
                  checked={settings.autoLinkEnabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateSetting("autoLinkEnabled", e.target.checked)
                  }
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Sync Interval (minutes)</label>
                <input
                  className="ui-input"
                  type="number"
                  value={settings.syncIntervalMinutes}
                  min={1}
                  max={1440}
                  onChange={(e: any) =>
                    updateSetting("syncIntervalMinutes", Number(e.target.value))
                  }
                />
              </div>
            </div>
          )}
        </Card>

        <Card className="ui-stack-4">
          <h3 className="ui-text-lg ui-font-semibold">Sync Actions</h3>
          <p className="ui-text-muted">
            Trigger a manual sync for connected mailboxes and calendars.
          </p>
          <div className="ui-flex-h-2">
            <Button
              onClick={() =>
                client
                  .post("/crm/activity-capture/sync/mailbox/default", {})
                  .then(() => alert("Mailbox sync triggered"))
              }
            >
              <Mail size={14} /> Sync Mailbox
            </Button>
            <Button
              onClick={() =>
                client
                  .post("/crm/activity-capture/sync/calendar/default", {})
                  .then(() => alert("Calendar sync triggered"))
              }
            >
              <Calendar size={14} /> Sync Calendar
            </Button>
          </div>
        </Card>

        <Card className="ui-stack-4">
          <h3 className="ui-text-lg ui-font-semibold">Linked Emails</h3>
          <Link
            href="/crm/activity-capture/unlinked"
            className="ui-btn ui-btn-outline ui-btn-sm"
          >
            <Link2 size={14} /> View Unlinked Emails
          </Link>
        </Card>
      </div>
    </div>
  );
}

export default function ActivityCapturePage() {
  return (
    <RouteGuard permission="crm.activity-capture.read">
      <Suspense
        fallback={
          <div className="ui-center-pad">
            <Spinner size="lg" />
          </div>
        }
      >
        <ActivityCaptureContent />
      </Suspense>
    </RouteGuard>
  );
}
