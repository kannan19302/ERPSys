"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { BookOpen, Plus, Users, CheckCircle2 } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function AdvancedHrLearningPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [paths, setPaths] = useState<any[]>([]);
  const [pathName, setPathName] = useState("");
  const toast = useToast();

  const loadPaths = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/advanced-hr/learning-paths-deep/paths",
      );
      setPaths(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load learning paths",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaths();
  }, []);

  const handleCreate = async () => {
    try {
      if (!pathName) {
        toast.error("Validation", "Path name required");
        return;
      }
      await client.post("/advanced-hr/learning-paths-deep/paths", {
        pathName,
        category: "LEADERSHIP",
        estimatedHours: 20,
      });
      toast.success("Path Created", `"${pathName}" learning path created.`);
      setPathName("");
      loadPaths();
    } catch (err) {
      toast.error(
        "Failed to create path",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spinner size="lg" />
      </div>
    );

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Corporate Learning & Development Path Manager"
        description="Build structured learning paths, track employee enrollment, and manage completion progress."
      />
      <Card style={{ padding: "20px", margin: "24px 0" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="New learning path name..."
            value={pathName}
            onChange={(e) => setPathName(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <Button onClick={handleCreate}>Create Path</Button>
        </div>
      </Card>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {paths.length === 0 ? (
          <Card
            style={{ padding: "32px", gridColumn: "1/-1", textAlign: "center" }}
          >
            <p style={{ color: "var(--color-text-secondary)" }}>
              No learning paths available.
            </p>
          </Card>
        ) : (
          paths.map((p) => (
            <Card key={p.id} style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <BookOpen size={18} color="var(--chart-5)" />
                <h4 style={{ fontSize: "15px", fontWeight: 600 }}>
                  {p.pathName}
                </h4>
              </div>
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "12px" }}
              >
                <Badge variant="info">{p.category}</Badge>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {p.estimatedHours}h
                </span>
              </div>
              <Button size="sm" variant="outline" style={{ width: "100%" }}>
                Enroll Team Members
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
