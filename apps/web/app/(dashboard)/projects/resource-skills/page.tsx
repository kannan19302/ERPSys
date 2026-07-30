// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Award,
  Search,
  BarChart3,
  Users,
  Plus,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  StatCardRow,
  useToast,
} from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  {
    id: "skills",
    label: "Skills",
    href: "/projects/resource-skills?tab=skills",
  },
  {
    id: "certifications",
    label: "Certifications",
    href: "/projects/resource-skills?tab=certifications",
  },
  {
    id: "gaps",
    label: "Gap Analysis",
    href: "/projects/resource-skills?tab=gaps",
  },
  {
    id: "matching",
    label: "Matching",
    href: "/projects/resource-skills?tab=matching",
  },
];

interface Skill {
  id: string;
  name: string;
  category?: string;
  description?: string;
  employeeSkills?: { id: string; proficiency: string }[];
}
interface Certification {
  id: string;
  name: string;
  employeeId: string;
  issuingBody?: string;
  issueDate: string;
  expiryDate?: string;
  status: string;
}
interface Gap {
  id: string;
  skill: { name: string };
  requiredLevel: string;
  currentCoverage?: number;
  gapScore?: number;
  recommendations?: string;
}

export default function ResourceSkillsPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "skills";
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [client]);
  const fetchData = async () => {
    try {
      setLoading(true);
      const [skillsData, certsData, gapsData] = await Promise.all([
        client.get<Skill[] | { data?: Skill[] }>("/projects/skills"),
        client.get<Certification[] | { data?: Certification[] }>(
          "/projects/certifications",
        ),
        client.get<Gap[] | { data?: Gap[] }>("/projects/skill-gaps"),
      ]);
      setSkills(Array.isArray(skillsData) ? skillsData : skillsData.data || []);
      setCertifications(
        Array.isArray(certsData) ? certsData : certsData.data || [],
      );
      setGaps(Array.isArray(gapsData) ? gapsData : gapsData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      notifyError("Error", String(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner size="lg" />;
  if (error) return <div className="ui-alert ui-alert-danger">{error}</div>;

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Resource Skills"
        description="Skills inventory, certifications, and gap analysis"
      />
      <div className="ui-flex-between">
        <SubTabBar tabs={SUB_TABS} />
        <div className="ui-hstack-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Add Skill (API ready)")}
          >
            <Plus size={14} /> New Skill
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Track Certification (API ready)")}
          >
            <Award size={14} /> Certify
          </Button>
        </div>
      </div>
      {activeTab === "skills" && (
        <>
          <StatCardRow
            stats={[
              {
                label: "Skills",
                value: skills.length,
                icon: <BookOpen size={16} />,
                color: "var(--chart-1)",
              },
              {
                label: "Assignments",
                value: skills.reduce(
                  (s, sk) => s + (sk.employeeSkills?.length || 0),
                  0,
                ),
                icon: <Users size={16} />,
                color: "var(--chart-2)",
              },
            ]}
          />
          <div className="ui-grid-auto">
            {skills.map((s) => (
              <Card key={s.id} className="ui-stack-2">
                <div className="ui-flex-between">
                  <h4 className="ui-text-label">{s.name}</h4>
                  {s.category && (
                    <span className="ui-badge ui-badge-info">{s.category}</span>
                  )}
                </div>
                <p className="ui-text-micro">{s.description || ""}</p>
                <p className="ui-text-micro">
                  {s.employeeSkills?.length || 0} employees
                </p>
              </Card>
            ))}
          </div>
        </>
      )}
      {activeTab === "certifications" && (
        <>
          <StatCardRow
            stats={[
              {
                label: "Total Certifications",
                value: certifications.length,
                icon: <Award size={16} />,
                color: "var(--chart-1)",
              },
              {
                label: "Active",
                value: certifications.filter((c) => c.status === "ACTIVE")
                  .length,
                icon: <ShieldCheck size={16} />,
                color: "var(--chart-2)",
              },
              {
                label: "Expired",
                value: certifications.filter((c) => c.status === "EXPIRED")
                  .length,
                icon: <ShieldCheck size={16} />,
                color: "var(--chart-4)",
              },
            ]}
          />
          <div className="ui-stack-3">
            {certifications.map((c) => (
              <Card key={c.id} className="ui-flex-between">
                <div>
                  <strong>{c.name}</strong>
                  <p className="ui-text-micro">
                    {c.issuingBody || ""} ·{" "}
                    {new Date(c.issueDate).toLocaleDateString()}
                    {c.expiryDate
                      ? ` - ${new Date(c.expiryDate).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <span
                  className={`ui-badge ${c.status === "ACTIVE" ? "ui-badge-success" : "ui-badge-muted"}`}
                >
                  {c.status}
                </span>
              </Card>
            ))}
          </div>
        </>
      )}
      {activeTab === "gaps" && (
        <>
          <StatCardRow
            stats={[
              {
                label: "Analyses",
                value: gaps.length,
                icon: <Search size={16} />,
                color: "var(--chart-1)",
              },
              {
                label: "Significant Gaps",
                value: gaps.filter((g) => Number(g.gapScore || 0) > 50).length,
                icon: <BarChart3 size={16} />,
                color: "var(--chart-4)",
              },
            ]}
          />
          <div className="ui-grid-auto">
            {gaps.map((g) => (
              <Card key={g.id} className="ui-stack-2">
                <div className="ui-flex-between">
                  <h4 className="ui-text-label">{g.skill.name}</h4>
                  <span
                    className={`ui-badge ${Number(g.gapScore || 0) > 50 ? "ui-badge-danger" : "ui-badge-warning"}`}
                  >
                    Gap: {Number(g.gapScore || 0).toFixed(0)}%
                  </span>
                </div>
                <p className="ui-text-micro">
                  Required: {g.requiredLevel} · Coverage:{" "}
                  {g.currentCoverage || 0}%
                </p>
                {g.recommendations && (
                  <p className="ui-text-micro">{g.recommendations}</p>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
      {activeTab === "matching" && (
        <div className="ui-stack-4">
          <p className="ui-text-muted">
            Resource matching dashboard loads available resources by skill. Use
            the API to find resources.
          </p>
          <div className="ui-grid-auto">
            {skills
              .filter((s) => s.employeeSkills?.length)
              .map((s) => (
                <Card key={s.id} className="ui-stack-2">
                  <h4 className="ui-text-label">{s.name}</h4>
                  <p className="ui-text-micro">
                    {s.employeeSkills?.length || 0} resources available
                  </p>
                  <div className="ui-hstack-2">
                    {["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].map(
                      (level) => {
                        const count =
                          s.employeeSkills?.filter(
                            (es) => es.proficiency === level,
                          ).length || 0;
                        return count > 0 ? (
                          <span key={level} className="ui-badge ui-badge-info">
                            {level}: {count}
                          </span>
                        ) : null;
                      },
                    )}
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
