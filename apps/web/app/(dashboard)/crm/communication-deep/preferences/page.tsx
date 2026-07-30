// @ts-nocheck
"use client";
import { useState } from "react";

export default function PreferencesPage() {
  const [entityType, setEntityType] = useState("CUSTOMER");
  const [entityId, setEntityId] = useState("");
  const [prefs, setPrefs] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (!entityId) return;
    const r = await fetch(
      `/api/crm/communication-deep/preferences?entityType=${entityType}&entityId=${entityId}`,
    );
    const d = await r.json();
    setPrefs(d);
    setLoaded(true);
  };

  const toggle = async (field: string, value: boolean) => {
    if (!prefs) return;
    const r = await fetch("/api/crm/communication-deep/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: prefs.entityType,
        entityId: prefs.entityId,
        [field]: value,
      }),
    });
    const d = await r.json();
    setPrefs(d);
  };

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Communication Preferences</h1>
      <div className="flex gap-3 mb-6 items-end">
        <div className="ui-form-group">
          <label className="text-sm font-medium">Entity Type</label>
          <select
            className="ui-input"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          >
            <option value="CUSTOMER">Customer</option>
            <option value="LEAD">Lead</option>
            <option value="CONTACT">Contact</option>
          </select>
        </div>
        <div className="ui-form-group">
          <label className="text-sm font-medium">Entity ID</label>
          <input
            className="ui-input"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder="e.g. cust-123"
          />
        </div>
        <button className="ui-btn" onClick={load}>
          Load Preferences
        </button>
      </div>
      {loaded && prefs && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded">
            <div>
              <span className="font-medium">Email</span>
              <p className="text-sm text-muted-foreground">
                Receive email communications
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefs.email}
              onChange={(e) => toggle("email", e.target.checked)}
              className="w-5 h-5"
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded">
            <div>
              <span className="font-medium">SMS</span>
              <p className="text-sm text-muted-foreground">
                Receive SMS messages
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefs.sms}
              onChange={(e) => toggle("sms", e.target.checked)}
              className="w-5 h-5"
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded">
            <div>
              <span className="font-medium">WhatsApp</span>
              <p className="text-sm text-muted-foreground">
                Receive WhatsApp messages
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefs.whatsapp}
              onChange={(e) => toggle("whatsapp", e.target.checked)}
              className="w-5 h-5"
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded">
            <div>
              <span className="font-medium">Push</span>
              <p className="text-sm text-muted-foreground">
                Receive push notifications
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefs.push}
              onChange={(e) => toggle("push", e.target.checked)}
              className="w-5 h-5"
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded">
            <div>
              <span className="font-medium">Marketing</span>
              <p className="text-sm text-muted-foreground">
                Receive marketing communications
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefs.marketing}
              onChange={(e) => toggle("marketing", e.target.checked)}
              className="w-5 h-5"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {new Date(prefs.updatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
