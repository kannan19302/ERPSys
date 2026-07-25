"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  Badge,
  useToast,
  DataTable,
  ProtectedComponent,
  type Column,
} from "@unerp/ui";
import { Target, Plus, X, Trash2 } from "lucide-react";
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  ApiRequestError,
} from "../../../../../src/lib/api";
import styles from "../../gamification/page.module.css";

interface TeamGoal {
  id: string;
  name: string;
  goalType: string;
  targetValue: number;
  currentValue: number;
  period: string;
  status: string;
  startDate: string;
  endDate: string;
}

const GOAL_TYPES = [
  "REVENUE",
  "DEALS_CLOSED",
  "LEADS_CREATED",
  "ACTIVITY_COUNT",
  "DEMOS_BOOKED",
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<TeamGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    goalType: "REVENUE",
    targetValue: 0,
    period: "",
    startDate: "",
    endDate: "",
  });
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<TeamGoal[]>("/crm/gamification-deep/goals");
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Could not load goals",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const createGoal = async () => {
    try {
      await apiPost("/crm/gamification-deep/goals", {
        ...form,
        targetValue: Number(form.targetValue),
      });
      toast.success("Goal created");
      setModalOpen(false);
      setForm({
        name: "",
        goalType: "REVENUE",
        targetValue: 0,
        period: "",
        startDate: "",
        endDate: "",
      });
      await load();
    } catch (err) {
      toast.error(
        "Failed to create goal",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await apiDelete(`/crm/gamification-deep/goals/${id}`);
      toast.success("Goal deleted");
      await load();
    } catch (err) {
      toast.error(
        "Failed to delete goal",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    }
  };

  const columns: Column<TeamGoal>[] = [
    { key: "name", header: "Name", sortable: true },
    {
      key: "goalType",
      header: "Type",
      sortable: true,
      render: (r) => <Badge variant="info">{r.goalType}</Badge>,
    },
    {
      key: "targetValue",
      header: "Target",
      sortable: true,
      render: (r) => `$${Number(r.targetValue).toLocaleString()}`,
    },
    {
      key: "currentValue",
      header: "Current",
      sortable: true,
      render: (r) => `$${Number(r.currentValue).toLocaleString()}`,
    },
    { key: "period", header: "Period", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => (
        <Badge
          variant={
            r.status === "ACTIVE"
              ? "success"
              : r.status === "COMPLETED"
                ? "info"
                : "warning"
          }
        >
          {r.status}
        </Badge>
      ),
    },
    {
      key: "id",
      header: "Actions",
      render: (r) => (
        <button
          className="ui-btn-icon"
          onClick={(e) => {
            e.stopPropagation();
            deleteGoal(r.id);
          }}
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  if (loading)
    return (
      <div className="ui-page">
        <Spinner />
      </div>
    );

  return (
    <div className="ui-page">
      <PageHeader
        title="Team Goals"
        subtitle="Revenue, deals, and activity targets"
      />
      <div className="ui-toolbar">
        <ProtectedComponent permission="crm.gamification-deep.goals.create">
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New Goal
          </Button>
        </ProtectedComponent>
      </div>
      <DataTable columns={columns} data={goals} />
      {modalOpen && (
        <div className={styles.overlay}>
          <Card className="ui-card" style={{ width: "min(100%, 30rem)" }}>
            <div className={styles.modalContent}>
              <h3>Create Goal</h3>
              <input
                className="ui-input"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <select
                className="ui-input"
                value={form.goalType}
                onChange={(e) => setForm({ ...form, goalType: e.target.value })}
              >
                {GOAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                className="ui-input"
                type="number"
                placeholder="Target Value"
                value={form.targetValue}
                onChange={(e) =>
                  setForm({ ...form, targetValue: Number(e.target.value) })
                }
              />
              <input
                className="ui-input"
                placeholder="Period (e.g. Q3-2026)"
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
              />
              <input
                className="ui-input"
                type="date"
                value={form.startDate.split("T")[0] || ""}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
              <input
                className="ui-input"
                type="date"
                value={form.endDate.split("T")[0] || ""}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
              <div
                className="ui-flex-row"
                style={{ gap: "var(--space-2)", justifyContent: "flex-end" }}
              >
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  <X size={16} /> Cancel
                </Button>
                <Button onClick={createGoal}>Create</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
