"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  DollarSign,
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Check,
  Search,
  FileText,
  TrendingUp,
  Handshake,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";

interface DiscountOffer {
  id: string;
  supplierName: string;
  invoiceAmount: number;
  discountRate: number;
  discountAmount: number;
  status: string;
  offerDate: string;
}

interface ScfProgram {
  id: string;
  programName: string;
  fundedAmount: number;
  availableLimit: number;
  interestRate: number;
  status: string;
}

interface FactoringFacility {
  id: string;
  facilityName: string;
  invoiceAmount: number;
  advanceRate: number;
  advanceAmount: number;
  status: string;
  maturityDate: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export default function WorkingCapitalPage() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") ||
    "discount-offers") as string;

  const [discountOffers, setDiscountOffers] = useState<DiscountOffer[]>([]);
  const [scfPrograms, setScfPrograms] = useState<ScfProgram[]>([]);
  const [facilities, setFacilities] = useState<FactoringFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [showFacilityForm, setShowFacilityForm] = useState(false);

  const [offerForm, setOfferForm] = useState({
    supplierName: "",
    invoiceAmount: "",
    discountRate: "",
  });
  const [programForm, setProgramForm] = useState({
    programName: "",
    availableLimit: "",
    interestRate: "",
  });
  const [facilityForm, setFacilityForm] = useState({
    facilityName: "",
    invoiceAmount: "",
    advanceRate: "",
    maturityDate: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [offers, programs, facs] = await Promise.all([
        client.get<DiscountOffer[]>(
          "/advanced-finance/working-capital/discount-offers",
        ),
        client.get<ScfProgram[]>(
          "/advanced-finance/working-capital/scf-programs",
        ),
        client.get<FactoringFacility[]>(
          "/advanced-finance/working-capital/factoring-facilities",
        ),
      ]);
      setDiscountOffers(offers);
      setScfPrograms(programs);
      setFacilities(facs);
    } catch {
      setError("Failed to load working capital data.");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOffer = async () => {
    if (!offerForm.supplierName || !offerForm.invoiceAmount) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/working-capital/discount-offers", {
        supplierName: offerForm.supplierName,
        invoiceAmount: parseFloat(offerForm.invoiceAmount),
        discountRate: parseFloat(offerForm.discountRate || "0"),
      });
      setSuccess("Discount offer created successfully.");
      setShowOfferForm(false);
      setOfferForm({ supplierName: "", invoiceAmount: "", discountRate: "" });
      fetchData();
    } catch {
      setError("Failed to create discount offer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondOffer = async (id: string, action: string) => {
    try {
      await client.patch(
        `/advanced-finance/working-capital/discount-offers/${id}`,
        { action },
      );
      setSuccess(`Offer ${action} successfully.`);
      fetchData();
    } catch {
      setError(`Failed to ${action} offer.`);
    }
  };

  const handleSettleOffer = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/working-capital/discount-offers/${id}/settle`,
        {},
      );
      setSuccess("Discount offer settled.");
      fetchData();
    } catch {
      setError("Failed to settle offer.");
    }
  };

  const handleCreateProgram = async () => {
    if (!programForm.programName || !programForm.availableLimit) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/working-capital/scf-programs", {
        programName: programForm.programName,
        availableLimit: parseFloat(programForm.availableLimit),
        interestRate: parseFloat(programForm.interestRate || "0"),
      });
      setSuccess("SCF Program created.");
      setShowProgramForm(false);
      setProgramForm({ programName: "", availableLimit: "", interestRate: "" });
      fetchData();
    } catch {
      setError("Failed to create SCF program.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateFacility = async () => {
    if (!facilityForm.facilityName || !facilityForm.invoiceAmount) return;
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/working-capital/factoring-facilities",
        {
          facilityName: facilityForm.facilityName,
          invoiceAmount: parseFloat(facilityForm.invoiceAmount),
          advanceRate: parseFloat(facilityForm.advanceRate || "0"),
          maturityDate: facilityForm.maturityDate || null,
        },
      );
      setSuccess("Facility created.");
      setShowFacilityForm(false);
      setFacilityForm({
        facilityName: "",
        invoiceAmount: "",
        advanceRate: "",
        maturityDate: "",
      });
      fetchData();
    } catch {
      setError("Failed to create facility.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvanceInvoice = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/working-capital/factoring-facilities/${id}/advance`,
        {},
      );
      setSuccess("Invoice advanced against facility.");
      fetchData();
    } catch {
      setError("Failed to advance invoice.");
    }
  };

  const totalDiscounted = discountOffers.reduce(
    (s, o) => s + o.discountAmount,
    0,
  );
  const totalScfFunded = scfPrograms.reduce((s, p) => s + p.fundedAmount, 0);
  const totalFactored = facilities.reduce((s, f) => s + f.advanceAmount, 0);

  return (
    <RouteGuard permission="finance.workingcapital.read">
      <div className="ui-page-container">
        <div className="ui-page-head">
          <div className="ui-page-head-content">
            <nav className="ui-breadcrumb">
              <span>Finance</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span>Advanced</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span className="ui-breadcrumb-current">
                Working Capital Management
              </span>
            </nav>
            <div className="ui-title-section">
              <DollarSign className="ui-title-icon" size={20} />
              <h1 className="ui-page-title">Working Capital Management</h1>
            </div>
            <p className="ui-page-subtitle">
              Manage discount offers, supply chain financing programs, and
              invoice factoring facilities.
            </p>
          </div>
          <div className="ui-page-actions">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {error && (
          <div className="ui-alert ui-alert-error mb-4">
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="ui-alert ui-alert-success mb-4">
            <Check size={16} /> {success}
          </div>
        )}

        <div className="ui-grid-3 mb-4">
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Total Discount Amount
            </h3>
            <p className="text-2xl font-bold mt-1">{fmt(totalDiscounted)}</p>
          </Card>
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              SCF Funded Amount
            </h3>
            <p className="text-2xl font-bold mt-1">{fmt(totalScfFunded)}</p>
          </Card>
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Factored Advances
            </h3>
            <p className="text-2xl font-bold mt-1">{fmt(totalFactored)}</p>
          </Card>
        </div>

        <div className="mb-4">
          <SubTabBar
            tabs={
              [
                {
                  id: "discount-offers",
                  label: "Discount Offers",
                  href: "/finance/advanced/working-capital?subtab=discount-offers",
                  icon: FileText,
                },
                {
                  id: "scf-programs",
                  label: "SCF Programs",
                  href: "/finance/advanced/working-capital?subtab=scf-programs",
                  icon: TrendingUp,
                },
                {
                  id: "factoring",
                  label: "Invoice Factoring",
                  href: "/finance/advanced/working-capital?subtab=factoring",
                  icon: Handshake,
                },
              ] as SubTab[]
            }
          />
        </div>

        {activeTab === "discount-offers" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowOfferForm(!showOfferForm)}>
                <Plus size={16} className="mr-1" /> Create Discount Offer
              </Button>
            </div>
            {showOfferForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Discount Offer</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Supplier Name</label>
                    <input
                      className="ui-input"
                      value={offerForm.supplierName}
                      onChange={(e) =>
                        setOfferForm({
                          ...offerForm,
                          supplierName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Invoice Amount ($)</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={offerForm.invoiceAmount}
                      onChange={(e) =>
                        setOfferForm({
                          ...offerForm,
                          invoiceAmount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Discount Rate (%)</label>
                    <input
                      className="ui-input"
                      type="number"
                      step="0.1"
                      value={offerForm.discountRate}
                      onChange={(e) =>
                        setOfferForm({
                          ...offerForm,
                          discountRate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleCreateOffer} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowOfferForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card">
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading...
                </div>
              ) : (
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "supplierName",
                        header: "Supplier",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "invoiceAmount",
                        header: "Invoice",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "discountRate",
                        header: "Rate %",
                        render: (v) => `${Number(v).toFixed(1)}%`,
                      },
                      {
                        key: "discountAmount",
                        header: "Discount",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v) => (
                          <span
                            className={`ui-badge ${v === "ACCEPTED" ? "ui-badge-green" : v === "PENDING" ? "ui-badge-yellow" : "ui-badge-gray"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "id",
                        header: "Actions",
                        render: (v, row) => (
                          <div className="flex gap-1">
                            {row.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleRespondOffer(String(v), "accept")
                                  }
                                  className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() =>
                                    handleRespondOffer(String(v), "reject")
                                  }
                                  className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {row.status === "ACCEPTED" && (
                              <button
                                onClick={() => handleSettleOffer(String(v))}
                                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                              >
                                Settle
                              </button>
                            )}
                          </div>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={discountOffers as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No discount offers"
                  emptyDescription="Create your first discount offer to get started."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "scf-programs" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowProgramForm(!showProgramForm)}>
                <Plus size={16} className="mr-1" /> Create Program
              </Button>
            </div>
            {showProgramForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New SCF Program</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Program Name</label>
                    <input
                      className="ui-input"
                      value={programForm.programName}
                      onChange={(e) =>
                        setProgramForm({
                          ...programForm,
                          programName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Available Limit ($)</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={programForm.availableLimit}
                      onChange={(e) =>
                        setProgramForm({
                          ...programForm,
                          availableLimit: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Interest Rate (%)</label>
                    <input
                      className="ui-input"
                      type="number"
                      step="0.01"
                      value={programForm.interestRate}
                      onChange={(e) =>
                        setProgramForm({
                          ...programForm,
                          interestRate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleCreateProgram}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowProgramForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card">
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading...
                </div>
              ) : (
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "programName",
                        header: "Program",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "fundedAmount",
                        header: "Funded",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "availableLimit",
                        header: "Limit",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "interestRate",
                        header: "Rate %",
                        render: (v) => `${Number(v).toFixed(2)}%`,
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v) => (
                          <span
                            className={`ui-badge ${v === "ACTIVE" ? "ui-badge-green" : "ui-badge-gray"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={scfPrograms as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No SCF programs"
                  emptyDescription="Create your first supply chain finance program."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "factoring" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowFacilityForm(!showFacilityForm)}>
                <Plus size={16} className="mr-1" /> Create Facility
              </Button>
            </div>
            {showFacilityForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Factoring Facility</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Facility Name</label>
                    <input
                      className="ui-input"
                      value={facilityForm.facilityName}
                      onChange={(e) =>
                        setFacilityForm({
                          ...facilityForm,
                          facilityName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Invoice Amount ($)</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={facilityForm.invoiceAmount}
                      onChange={(e) =>
                        setFacilityForm({
                          ...facilityForm,
                          invoiceAmount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Advance Rate (%)</label>
                    <input
                      className="ui-input"
                      type="number"
                      step="1"
                      value={facilityForm.advanceRate}
                      onChange={(e) =>
                        setFacilityForm({
                          ...facilityForm,
                          advanceRate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Maturity Date</label>
                    <input
                      className="ui-input"
                      type="date"
                      value={facilityForm.maturityDate}
                      onChange={(e) =>
                        setFacilityForm({
                          ...facilityForm,
                          maturityDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleCreateFacility}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowFacilityForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card">
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading...
                </div>
              ) : (
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "facilityName",
                        header: "Facility",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "invoiceAmount",
                        header: "Invoice",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "advanceRate",
                        header: "Advance %",
                        render: (v) => `${Number(v)}%`,
                      },
                      {
                        key: "advanceAmount",
                        header: "Advance Amount",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v) => (
                          <span
                            className={`ui-badge ${v === "ACTIVE" ? "ui-badge-green" : v === "CLOSED" ? "ui-badge-gray" : "ui-badge-yellow"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "id",
                        header: "Actions",
                        render: (v) => (
                          <button
                            onClick={() => handleAdvanceInvoice(String(v))}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                          >
                            Advance Invoice
                          </button>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={facilities as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No facilities"
                  emptyDescription="Create your first factoring facility."
                />
              )}
            </Card>
          </>
        )}
      </div>
    </RouteGuard>
  );
}
