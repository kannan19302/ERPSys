// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { ThumbsUp, Lightbulb, MessageSquarePlus } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function SaasPortalFeedbackPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const toast = useToast();

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/saas-portal/feedback-roadmap/requests",
      );
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Feedback & Roadmap",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSubmit = async () => {
    try {
      if (!title || !description) {
        toast.error("Validation Error", "Title and description are required");
        return;
      }
      await client.post("/saas-portal/feedback-roadmap/requests", {
        title,
        description,
        category: "UI/UX",
      });
      toast.success(
        "Feedback Submitted",
        "Thank you! Feature idea submitted to public roadmap.",
      );
      setTitle("");
      setDescription("");
      loadRequests();
    } catch (err) {
      toast.error(
        "Failed to submit feedback",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  const handleVote = async (id: string) => {
    try {
      await client.post(
        `/saas-portal/feedback-roadmap/requests/${id}/vote`,
        {},
      );
      toast.success("Vote Recorded", "Upvote added to feature request!");
      loadRequests();
    } catch (err) {
      toast.error(
        "Failed to register vote",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  if (loading) {
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
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Public Feature Requests & Product Roadmap"
        description="Propose feature requests, upvote community ideas, and follow live feature development progress."
      />

      <Card style={{ padding: "24px", margin: "24px 0" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Submit a Feature Idea
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            type="text"
            placeholder="Feature Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <textarea
            placeholder="Detailed description of your feature idea..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              height: "80px",
            }}
          />
          <Button style={{ alignSelf: "flex-start" }} onClick={handleSubmit}>
            Submit Feature Request
          </Button>
        </div>
      </Card>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Community Feature Requests
        </h3>
        {requests.length === 0 ? (
          <p
            style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}
          >
            No public feature requests submitted yet.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {requests.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              >
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 600 }}>
                    {r.title}
                  </div>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#64748b",
                      margin: "4px 0 0 0",
                    }}
                  >
                    {r.description}
                  </p>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
                >
                  <Badge variant="info">{r.status}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVote(r.id)}
                  >
                    <ThumbsUp size={14} style={{ marginRight: "6px" }} />
                    {r.upvotesCount}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
