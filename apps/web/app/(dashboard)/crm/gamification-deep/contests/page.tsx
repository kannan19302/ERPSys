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
import { Trophy, Plus, X, Play, Square, Trash2 } from "lucide-react";
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  ApiRequestError,
} from "../../../../../src/lib/api";
import styles from "../../gamification/page.module.css";
import Link from "next/link";

interface Contest {
  id: string;
  name: string;
  contestType: string;
  prize: string | null;
  startDate: string;
  endDate: string;
  status: string;
  _count?: { entries: number };
}

const CONTEST_TYPES = [
  "REVENUE_RACE",
  "DEALS_CLOSED",
  "LEADS_CREATED",
  "ACTIVITY",
  "MIXED",
];

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contestType: "REVENUE_RACE",
    prize: "",
    startDate: "",
    endDate: "",
  });
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Contest[]>("/crm/gamification-deep/contests");
      setContests(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Could not load contests",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const createContest = async () => {
    try {
      await apiPost("/crm/gamification-deep/contests", {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
      toast.success("Contest created");
      setModalOpen(false);
      setForm({
        name: "",
        contestType: "REVENUE_RACE",
        prize: "",
        startDate: "",
        endDate: "",
      });
      await load();
    } catch (err) {
      toast.error(
        "Failed to create contest",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    }
  };

  const startContest = async (id: string) => {
    try {
      await apiPost(`/crm/gamification-deep/contests/${id}/start`, {});
      toast.success("Contest started");
      await load();
    } catch (err) {
      toast.error(
        "Failed to start contest",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    }
  };

  const endContest = async (id: string) => {
    try {
      await apiPost(`/crm/gamification-deep/contests/${id}/end`, {});
      toast.success("Contest ended");
      await load();
    } catch (err) {
      toast.error(
        "Failed to end contest",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    }
  };

  const deleteContest = async (id: string) => {
    try {
      await apiDelete(`/crm/gamification-deep/contests/${id}`);
      toast.success("Contest deleted");
      await load();
    } catch (err) {
      toast.error(
        "Failed to delete contest",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    }
  };

  const columns: Column<Contest>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (r) => (
        <Link
          href={`/crm/gamification-deep/contests/${r.id}`}
          className="ui-link"
        >
          {r.name}
        </Link>
      ),
    },
    {
      key: "contestType",
      header: "Type",
      sortable: true,
      render: (r) => <Badge variant="info">{r.contestType}</Badge>,
    },
    { key: "prize", header: "Prize", sortable: true },
    {
      key: "_count",
      header: "Entries",
      sortable: true,
      render: (r) => r._count?.entries ?? 0,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => (
        <Badge
          variant={
            r.status === "ACTIVE"
              ? "success"
              : r.status === "DRAFT"
                ? "warning"
                : "info"
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
        <div className="ui-flex-row" style={{ gap: "var(--space-1)" }}>
          {r.status === "DRAFT" && (
            <button
              className="ui-btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                startContest(r.id);
              }}
            >
              <Play size={16} />
            </button>
          )}
          {r.status === "ACTIVE" && (
            <button
              className="ui-btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                endContest(r.id);
              }}
            >
              <Square size={16} />
            </button>
          )}
          <button
            className="ui-btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              deleteContest(r.id);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
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
        title="Sales Contests"
        description="Competitions and races for the sales team"
      />
      <div className="ui-toolbar">
        <ProtectedComponent permission="crm.gamification-deep.contests.create">
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New Contest
          </Button>
        </ProtectedComponent>
      </div>
      <DataTable columns={columns} data={contests} />
      {modalOpen && (
        <div className={styles.overlay}>
          <Card className="ui-card" style={{ width: "min(100%, 30rem)" }}>
            <div className={styles.modalContent}>
              <h3>Create Contest</h3>
              <input
                className="ui-input"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <select
                className="ui-input"
                value={form.contestType}
                onChange={(e) =>
                  setForm({ ...form, contestType: e.target.value })
                }
              >
                {CONTEST_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                className="ui-input"
                placeholder="Prize (optional)"
                value={form.prize}
                onChange={(e) => setForm({ ...form, prize: e.target.value })}
              />
              <label>Start Date</label>
              <input
                className="ui-input"
                type="date"
                value={form.startDate.split("T")[0] || ""}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
              <label>End Date</label>
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
                <Button onClick={createContest}>Create</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
