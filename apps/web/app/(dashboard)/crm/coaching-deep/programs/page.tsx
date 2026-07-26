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
import { GraduationCap, Plus, X } from "lucide-react";
import { apiGet, apiPost, ApiRequestError } from "../../../../../src/lib/api";
import styles from "../../coaching/page.module.css";
import Link from "next/link";

interface Program {
  id: string;
  name: string;
  programType: string;
  status: string;
  isRequired: boolean;
  durationDays: number | null;
  modules: Array<{ name: string }> | null;
  assigneeIds: string[] | null;
}

const PROGRAM_TYPES = [
  "ONBOARDING",
  "SKILL_IMPROVEMENT",
  "PRODUCT_TRAINING",
  "MANAGEMENT",
];

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    programType: "ONBOARDING",
    isRequired: false,
  });
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Program[]>("/crm/coaching-deep/programs");
      setPrograms(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Could not load programs",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const createProgram = async () => {
    try {
      await apiPost("/crm/coaching-deep/programs", form);
      toast.success("Program created");
      setModalOpen(false);
      setForm({ name: "", programType: "ONBOARDING", isRequired: false });
      await load();
    } catch (err) {
      toast.error(
        "Failed to create program",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    }
  };

  const columns: Column<Program>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (r) => (
        <Link href={`/crm/coaching-deep/programs/${r.id}`} className="ui-link">
          {r.name}
        </Link>
      ),
    },
    {
      key: "programType",
      header: "Type",
      sortable: true,
      render: (r) => <Badge variant="info">{r.programType}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => (
        <Badge variant={r.status === "ACTIVE" ? "success" : "warning"}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "isRequired",
      header: "Required",
      sortable: true,
      render: (r) =>
        r.isRequired ? <Badge variant="warning">Yes</Badge> : "No",
    },
    {
      key: "assigneeIds",
      header: "Enrolled",
      sortable: true,
      render: (r) => (r.assigneeIds ?? []).length,
    },
    {
      key: "modules",
      header: "Modules",
      sortable: true,
      render: (r) => (r.modules ?? []).length,
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
        title="Coaching Programs"
        description="Onboarding, skill improvement, product training"
      />
      <ProtectedComponent permission="crm.coaching-deep.programs.create">
        <div className="ui-toolbar">
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New Program
          </Button>
        </div>
      </ProtectedComponent>
      <DataTable columns={columns} data={programs} />
      {modalOpen && (
        <div className={styles.overlay}>
          <Card className="ui-card" style={{ width: "min(100%, 30rem)" }}>
            <div className={styles.modalContent}>
              <h3>Create Program</h3>
              <input
                className="ui-input"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <select
                className="ui-input"
                value={form.programType}
                onChange={(e) =>
                  setForm({ ...form, programType: e.target.value })
                }
              >
                {PROGRAM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <label
                className="ui-flex-row"
                style={{ alignItems: "center", gap: "var(--space-2)" }}
              >
                <input
                  type="checkbox"
                  checked={form.isRequired}
                  onChange={(e) =>
                    setForm({ ...form, isRequired: e.target.checked })
                  }
                />{" "}
                Required
              </label>
              <div
                className="ui-flex-row"
                style={{ gap: "var(--space-2)", justifyContent: "flex-end" }}
              >
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  <X size={16} /> Cancel
                </Button>
                <Button onClick={createProgram}>Create</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
