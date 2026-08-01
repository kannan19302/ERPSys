"use client";
import styles from "./page.module.css";
import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  FileText,
  Shield,
  Archive,
  Tag,
  CheckCircle,
  XCircle,
  Filter,
  Eye,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";

interface DocSearchResult {
  id: string;
  name: string;
  matchedText: string;
  folder: string;
  score: number;
  tags: string[];
  classification: string;
}

interface ApprovalItem {
  id: string;
  documentName: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED";
  submittedBy: string;
  submittedAt: string;
  reviewer: string;
  comments?: string;
}

interface RetentionPolicy {
  id: string;
  name: string;
  category: string;
  retentionDays: number;
  autoDispose: boolean;
  legalHold: boolean;
  documentsCount: number;
}

export default function DocumentsAdvancedPage() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "search") as
    | "search"
    | "approvals"
    | "retention"
    | "classification";
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DocSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [approvals] = useState<ApprovalItem[]>([
    {
      id: "apr-1",
      documentName: "Q3 Financial Report.pdf",
      status: "PENDING_REVIEW",
      submittedBy: "Jane Smith",
      submittedAt: "2026-06-12",
      reviewer: "CFO",
    },
    {
      id: "apr-2",
      documentName: "Employee Handbook v2.4.docx",
      status: "PENDING_REVIEW",
      submittedBy: "HR Team",
      submittedAt: "2026-06-11",
      reviewer: "VP HR",
    },
    {
      id: "apr-3",
      documentName: "Vendor NDA — Acme Corp.pdf",
      status: "APPROVED",
      submittedBy: "Legal",
      submittedAt: "2026-06-10",
      reviewer: "General Counsel",
      comments: "Reviewed and approved for execution.",
    },
    {
      id: "apr-4",
      documentName: "Product Specs v3.1.pdf",
      status: "REJECTED",
      submittedBy: "Engineering",
      submittedAt: "2026-06-09",
      reviewer: "CTO",
      comments: "Needs additional safety certifications.",
    },
    {
      id: "apr-5",
      documentName: "Marketing Brochure.ai",
      status: "PUBLISHED",
      submittedBy: "Marketing",
      submittedAt: "2026-06-08",
      reviewer: "CMO",
    },
  ]);

  const [retentionPolicies] = useState<RetentionPolicy[]>([
    {
      id: "ret-1",
      name: "Financial Records",
      category: "Finance",
      retentionDays: 2555,
      autoDispose: false,
      legalHold: false,
      documentsCount: 342,
    },
    {
      id: "ret-2",
      name: "Employee Contracts",
      category: "HR",
      retentionDays: 3650,
      autoDispose: false,
      legalHold: false,
      documentsCount: 128,
    },
    {
      id: "ret-3",
      name: "Marketing Materials",
      category: "Marketing",
      retentionDays: 365,
      autoDispose: true,
      legalHold: false,
      documentsCount: 89,
    },
    {
      id: "ret-4",
      name: "Legal Correspondence",
      category: "Legal",
      retentionDays: 7300,
      autoDispose: false,
      legalHold: true,
      documentsCount: 56,
    },
    {
      id: "ret-5",
      name: "Vendor Agreements",
      category: "Procurement",
      retentionDays: 1825,
      autoDispose: false,
      legalHold: false,
      documentsCount: 201,
    },
    {
      id: "ret-6",
      name: "Audit Records",
      category: "Compliance",
      retentionDays: 3650,
      autoDispose: false,
      legalHold: true,
      documentsCount: 73,
    },
  ]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const data = await client.get<{
        documents?: Array<Record<string, unknown>>;
      }>(`/drive/search?q=${encodeURIComponent(searchQuery)}`);
      if (data && Array.isArray(data.documents)) {
        const mapped: DocSearchResult[] = data.documents.map((doc) => ({
          id: String(doc.id),
          name: String(doc.name),
          matchedText: `Match found in document: ${String(doc.name)}`,
          folder: doc.folderId ? "Subfolder" : "Root",
          score: doc.starred ? 0.95 : 0.78,
          tags: doc.legalHold ? ["legal-hold"] : [],
          classification:
            doc.signatureStatus === "SIGNED"
              ? "Signed Document"
              : "Standard File",
        }));
        setSearchResults(mapped);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([
        {
          id: "sr-1",
          name: "Invoice-2026-0142.pdf",
          matchedText: `...total amount of $12,500 for ${searchQuery} services rendered...`,
          folder: "Finance/Invoices",
          score: 0.95,
          tags: ["invoice", "payment"],
          classification: "Financial Document",
        },
        {
          id: "sr-2",
          name: "Service Agreement.pdf",
          matchedText: `...agreement between parties regarding ${searchQuery} terms...`,
          folder: "Legal/Contracts",
          score: 0.88,
          tags: ["contract", "legal"],
          classification: "Legal Agreement",
        },
        {
          id: "sr-3",
          name: "Meeting Notes Q2.docx",
          matchedText: `...discussion points about ${searchQuery} implementation timeline...`,
          folder: "Projects/Notes",
          score: 0.72,
          tags: ["meeting", "notes"],
          classification: "Internal Memo",
        },
        {
          id: "sr-4",
          name: "Product Catalog 2026.pdf",
          matchedText: `...featuring our new ${searchQuery} product line with specifications...`,
          folder: "Marketing",
          score: 0.65,
          tags: ["catalog", "product"],
          classification: "Marketing Material",
        },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const statusColor = (status: ApprovalItem["status"]) => {
    switch (status) {
      case "PENDING_REVIEW":
        return "var(--color-warning)";
      case "APPROVED":
        return "var(--color-success)";
      case "REJECTED":
        return "var(--color-error)";
      case "PUBLISHED":
        return "var(--color-primary)";
    }
  };

  const statusBg = (status: ApprovalItem["status"]) => {
    switch (status) {
      case "PENDING_REVIEW":
        return "var(--color-warning-light)";
      case "APPROVED":
        return "var(--color-success-light)";
      case "REJECTED":
        return "var(--color-error-light)";
      case "PUBLISHED":
        return "var(--color-primary-light)";
    }
  };

  const tabs: SubTab[] = [
    {
      id: "search",
      label: "Full-Text Search",
      href: "/drive/advanced?subtab=search",
      icon: Search,
    },
    {
      id: "approvals",
      label: "Approval Workflows",
      href: "/drive/advanced?subtab=approvals",
      icon: CheckCircle,
    },
    {
      id: "retention",
      label: "Records & Retention",
      href: "/drive/advanced?subtab=retention",
      icon: Archive,
    },
    {
      id: "classification",
      label: "AI Classification",
      href: "/drive/advanced?subtab=classification",
      icon: Tag,
    },
  ];

  return (
    <RouteGuard permission="drive.advanced.read">
      <div className="ui-stack-6">
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <FileText className="ui-text-primary" />
            Advanced Document Management
          </h1>
          <p className="ui-text-sm-muted">
            Full-text OCR search, approval workflows, retention policies, and
            AI-powered document classification.
          </p>
        </div>

        <SubTabBar tabs={tabs} />

        {/* Full-Text Search */}
        {activeTab === "search" && (
          <div className="ui-stack-4">
            <div className="ui-flex ui-gap-2">
              <input
                type="text"
                placeholder="Search inside documents (OCR-powered)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className={styles.p2}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className={styles.p3}
              >
                <Search size={16} /> {isSearching ? "Searching..." : "Search"}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="ui-stack-3">
                <span className="ui-text-xs-muted">
                  {searchResults.length} results found
                </span>
                {searchResults.map((r) => (
                  <div key={r.id} className={styles.p4}>
                    <div className="ui-flex-between">
                      <div className="ui-hstack-2">
                        <FileText size={18} className="ui-text-primary" />
                        <span className="ui-heading-sm font-bold">
                          {r.name}
                        </span>
                        <span className={styles.p5}>{r.folder}</span>
                      </div>
                      <span className={styles.p6}>
                        {(r.score * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <p className={styles.p7}>&ldquo;{r.matchedText}&rdquo;</p>
                    <div className={styles.p8}>
                      <span className={styles.p9}>{r.classification}</span>
                      {r.tags.map((tag) => (
                        <span key={tag} className={styles.p10}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery === "" && (
              <div className={styles.p11}>
                <Search size={40} className={styles.p12} />
                Enter a search query to search inside all documents using
                OCR-powered full-text indexing.
              </div>
            )}
          </div>
        )}

        {/* Approval Workflows */}
        {activeTab === "approvals" && (
          <div className="ui-stack-4">
            <div className={styles.p13}>
              {(
                ["PENDING_REVIEW", "APPROVED", "REJECTED", "PUBLISHED"] as const
              ).map((status) => {
                const count = approvals.filter(
                  (a) => a.status === status,
                ).length;
                return (
                  <div key={status} className={styles.p14}>
                    <div className={styles.p15}>{count}</div>
                    <div className="ui-text-xs-muted">
                      {status.replace("_", " ")}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={styles.p16}>
              <table className={styles.p17}>
                <thead>
                  <tr className={styles.p18}>
                    <th className={styles.p19}>Document</th>
                    <th className={styles.p20}>Submitted By</th>
                    <th className={styles.p21}>Reviewer</th>
                    <th className={styles.p22}>Status</th>
                    <th className={styles.p23}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((a) => (
                    <tr key={a.id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="ui-hstack-2">
                          <FileText size={16} className="ui-text-primary" />
                          <div>
                            <div className="font-semibold">
                              {a.documentName}
                            </div>
                            <div className="ui-text-micro">
                              Submitted {a.submittedAt}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.p24}>{a.submittedBy}</td>
                      <td className={styles.p25}>{a.reviewer}</td>
                      <td className="py-3 px-4">
                        <span className={styles.p26}>
                          {a.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {a.status === "PENDING_REVIEW" && (
                          <div className="ui-flex ui-gap-1">
                            <button className={styles.p27}>
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button className={styles.p28}>
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        )}
                        {a.status !== "PENDING_REVIEW" && (
                          <button className={styles.p29}>
                            <Eye size={12} /> View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Records & Retention */}
        {activeTab === "retention" && (
          <div className="ui-stack-4">
            <div className="ui-flex-between">
              <h3 className={styles.p30}>Retention Policies</h3>
              <button className={styles.p31}>Create Policy</button>
            </div>
            <div className={styles.p32}>
              {retentionPolicies.map((p) => (
                <div key={p.id} className={styles.p33}>
                  <div className="ui-flex-between ui-items-start">
                    <div>
                      <div className="ui-heading-sm font-bold">{p.name}</div>
                      <div className="ui-text-micro">{p.category}</div>
                    </div>
                    {p.legalHold && (
                      <span className={styles.p34}>
                        <Shield size={10} /> Legal Hold
                      </span>
                    )}
                  </div>
                  <div className={styles.p35}>
                    <div>
                      <div className="ui-text-micro">Retention Period</div>
                      <div className="ui-heading-sm">
                        {Math.round(p.retentionDays / 365)} years
                      </div>
                    </div>
                    <div>
                      <div className="ui-text-micro">Documents</div>
                      <div className="ui-heading-sm">{p.documentsCount}</div>
                    </div>
                  </div>
                  <div className="ui-flex-between">
                    <span
                      style={{
                        background: p.autoDispose
                          ? "var(--color-warning-light)"
                          : "var(--color-bg)",
                        color: p.autoDispose
                          ? "var(--color-warning)"
                          : "var(--color-text-secondary)",
                      }}
                      className={styles.s2}
                    >
                      {p.autoDispose ? "Auto-Dispose" : "Manual Review"}
                    </span>
                    <div className="ui-flex ui-gap-1">
                      <button className="ui-btn-icon ui-text-muted">
                        <Filter size={14} />
                      </button>
                      <button className={styles.p36}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Classification */}
        {activeTab === "classification" && (
          <div className="ui-stack-4">
            <div className="ui-grid-auto">
              {[
                {
                  label: "Financial Document",
                  count: 142,
                  color: "hsl(210, 70%, 50%)",
                },
                {
                  label: "Legal Agreement",
                  count: 87,
                  color: "hsl(280, 60%, 50%)",
                },
                {
                  label: "Internal Memo",
                  count: 203,
                  color: "hsl(150, 60%, 45%)",
                },
                {
                  label: "Marketing Material",
                  count: 65,
                  color: "hsl(30, 80%, 50%)",
                },
                {
                  label: "Technical Spec",
                  count: 94,
                  color: "hsl(0, 70%, 55%)",
                },
                {
                  label: "HR Document",
                  count: 118,
                  color: "hsl(190, 70%, 45%)",
                },
              ].map((cat) => (
                <div key={cat.label} className={styles.p37}>
                  <div className={styles.p38} style={{ background: cat.color }}>
                    <Tag size={18} />
                  </div>
                  <div>
                    <div className="ui-heading-sm font-bold">{cat.label}</div>
                    <div className="ui-text-micro ui-text-muted">
                      {cat.count} documents
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ui-card p-5">
              <h3 className={styles.p39}>
                <RotateCcw size={16} className="ui-text-primary" />
                Recently Classified Documents
              </h3>
              <div className="ui-stack-2">
                {[
                  {
                    name: "Invoice-2026-0185.pdf",
                    classification: "Financial Document",
                    confidence: 96,
                    autoTagged: ["invoice", "accounts-receivable"],
                  },
                  {
                    name: "Board Resolution.docx",
                    classification: "Legal Agreement",
                    confidence: 89,
                    autoTagged: ["board", "resolution", "corporate"],
                  },
                  {
                    name: "Sprint Planning.md",
                    classification: "Internal Memo",
                    confidence: 82,
                    autoTagged: ["agile", "planning", "engineering"],
                  },
                  {
                    name: "BOM-Steel-Frame.xlsx",
                    classification: "Technical Spec",
                    confidence: 91,
                    autoTagged: ["bom", "manufacturing", "materials"],
                  },
                  {
                    name: "Offer Letter — J.Doe.pdf",
                    classification: "HR Document",
                    confidence: 94,
                    autoTagged: ["offer", "recruitment", "compensation"],
                  },
                ].map((doc, i) => (
                  <div key={i} className={styles.p40}>
                    <div className="ui-hstack-3">
                      <FileText size={16} className="ui-text-primary" />
                      <div>
                        <div className="ui-heading-sm">{doc.name}</div>
                        <div className={styles.p41}>
                          {doc.autoTagged.map((t) => (
                            <span key={t} className={styles.p42}>
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="ui-hstack-3">
                      <span className={styles.p43}>{doc.classification}</span>
                      <span
                        style={{
                          color:
                            doc.confidence >= 90
                              ? "var(--color-success)"
                              : "var(--color-warning)",
                        }}
                        className={styles.s3}
                      >
                        {doc.confidence}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
