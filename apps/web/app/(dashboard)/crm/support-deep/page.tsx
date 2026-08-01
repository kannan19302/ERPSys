"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import {
  Plus,
  Trash2,
  Play,
  Activity,
  TrendingUp,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { apiGet, apiSend } from "../_components/api";

interface Macro {
  id: string;
  name: string;
  description?: string;
  category?: string;
  actions: any[];
  shortcut?: string;
  isActive: boolean;
  usageCount: number;
}
interface Escalation {
  id: string;
  caseId: string;
  escalatedBy: string;
  escalatedTo: string;
  reason: string;
  priority: string;
  status: string;
  createdAt: string;
}
interface CsatSummary {
  totalResponses: number;
  averageScore: number;
  distribution: Record<number, number>;
}

export default function SupportDeepPage() {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [csat, setCsat] = useState<CsatSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMacroForm, setShowMacroForm] = useState(false);
  const [macroForm, setMacroForm] = useState({
    name: "",
    description: "",
    actions: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [m, e, c] = await Promise.all([
        apiGet("/api/crm/support/macros"),
        apiGet("/api/crm/support/escalations?limit=20"),
        apiGet("/api/crm/support/csat/summary"),
      ]);
      setMacros(Array.isArray(m) ? m : (m as any)?.data || []);
      setEscalations(Array.isArray(e) ? e : (e as any)?.data || []);
      setCsat(
        c && typeof c === "object" && "overallCsat" in c
          ? c
          : (c as any)?.data || null,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createMacro = async () => {
    let actions: any[];
    try {
      actions = JSON.parse(macroForm.actions);
    } catch {
      actions = [{ type: "add_note", value: macroForm.description }];
    }
    await apiSend("/api/crm/support/macros", "POST", { ...macroForm, actions });
    setShowMacroForm(false);
    setMacroForm({ name: "", description: "", actions: "" });
    load();
  };

  const deleteMacro = async (id: string) => {
    await apiSend(`/api/crm/support/macros/${id}`, "DELETE");
    load();
  };

  const executeMacro = async (macroId: string) => {
    const caseId = prompt("Enter Case ID to apply macro:");
    if (caseId) {
      await apiSend(
        `/api/crm/support/macros/${macroId}/execute/${caseId}`,
        "POST",
      );
      alert("Macro executed");
    }
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="Support Tools"
        description="Macros, escalations, and CSAT management"
      />
      <div className="ui-flex ui-gap-2 ui-mb-4 ui-flex-wrap">
        <Link href="/crm/support-deep/agent-performance">
          <Button variant="outline">
            <BarChart3 size={14} /> Agent Performance
          </Button>
        </Link>
        <Link href="/crm/support-deep/live-chat">
          <Button variant="outline">
            <MessageSquare size={14} /> Live Chat
          </Button>
        </Link>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="ui-grid-3">
          <Card>
            <div className="ui-card-body">
              <h3 className="ui-card-title">
                <Activity size={16} /> Ticket Macros
              </h3>
              <Button
                size="sm"
                className="ui-mb-2"
                onClick={() => setShowMacroForm(true)}
              >
                <Plus size={12} /> New
              </Button>
              {showMacroForm && (
                <div className="ui-mb-3 p-2 ui-border">
                  <input
                    className="ui-input ui-mb-1"
                    placeholder="Name"
                    value={macroForm.name}
                    onChange={(e) =>
                      setMacroForm({ ...macroForm, name: e.target.value })
                    }
                  />
                  <textarea
                    className="ui-input ui-mb-1"
                    rows={3}
                    placeholder='Actions JSON e.g. [{"type":"set_status","value":"RESOLVED"}]'
                    value={macroForm.actions}
                    onChange={(e) =>
                      setMacroForm({ ...macroForm, actions: e.target.value })
                    }
                  />
                  <div className="ui-flex ui-gap-1">
                    <Button size="sm" onClick={createMacro}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowMacroForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              {macros.map((m) => (
                <div
                  key={m.id}
                  className="ui-flex ui-items-center ui-justify-between ui-py-1 ui-border-b"
                >
                  <div>
                    <strong className="ui-text-sm">{m.name}</strong>
                    <span className="ui-text-xs text-muted ui-ml-1">
                      ({m.usageCount})
                    </span>
                  </div>
                  <div className="ui-flex ui-gap-1">
                    <button
                      className="ui-btn-icon"
                      onClick={() => executeMacro(m.id)}
                      title="Execute"
                    >
                      <Play size={12} />
                    </button>
                    <button
                      className="ui-btn-icon"
                      onClick={() => deleteMacro(m.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {macros.length === 0 && (
                <p className="ui-text-sm text-muted">No macros</p>
              )}
            </div>
          </Card>

          <Card>
            <div className="ui-card-body">
              <h3 className="ui-card-title">
                <TrendingUp size={16} /> Escalations
              </h3>
              {escalations.map((e) => (
                <div
                  key={e.id}
                  className="ui-flex ui-items-center ui-justify-between ui-py-1 ui-border-b"
                >
                  <div>
                    <span className="ui-text-sm">
                      {e.reason.substring(0, 40)}
                    </span>
                    <Badge
                      variant={e.status === "OPEN" ? "warning" : "success"}
                      className="ui-ml-1"
                    >
                      {e.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {escalations.length === 0 && (
                <p className="ui-text-sm text-muted">No escalations</p>
              )}
            </div>
          </Card>

          <Card>
            <div className="ui-card-body">
              <h3 className="ui-card-title">
                <BarChart3 size={16} /> CSAT Summary
              </h3>
              {csat ? (
                <div>
                  <p className="ui-text-2xl ui-font-bold">
                    {csat.averageScore.toFixed(1)}{" "}
                    <span className="ui-text-sm text-muted">avg / 5</span>
                  </p>
                  <p className="ui-text-sm text-muted">
                    {csat.totalResponses} responses
                  </p>
                  <div className="ui-mt-2">
                    {[5, 4, 3, 2, 1].map((s) => (
                      <div
                        key={s}
                        className="ui-flex ui-items-center ui-gap-1 ui-text-xs"
                      >
                        <span style={{ width: 20 }}>{s}★</span>
                        <div className="ui-flex-1 ui-h-2 ui-bg-gray-200 ui-rounded">
                          <div
                            className="ui-h-2 ui-rounded ui-bg-blue-500"
                            style={{
                              width: `${csat.totalResponses ? ((csat.distribution[s] || 0) / csat.totalResponses) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span>{csat.distribution[s] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="ui-text-sm text-muted">No data</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
