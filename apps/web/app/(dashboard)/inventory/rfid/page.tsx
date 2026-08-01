"use client";
import { useState, useEffect, useCallback } from "react";
import {
  DataTable,
  PageHeader,
  Button,
  Spinner,
  StatusBadge,
  Modal,
  FormField,
  Input,
  Card,
  useToast,
  type Column,
  type SortOrder,
} from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import { apiGet, apiPost, apiPatch } from "../../../../src/lib/api";
import {
  Tag,
  Plus,
  Upload,
  MapPin,
  Radio,
  X,
  Activity,
  Eye,
  Trash2,
} from "lucide-react";

interface RfidTag {
  id: string;
  epc: string;
  tagType: string;
  productId: string | null;
  product?: { id: string; name: string } | null;
  status: string;
  lastLocation: string | null;
  lastRead: string | null;
  createdAt: string;
}

interface DashboardSummary {
  activeTags: number;
  inTransit: number;
  retired: number;
  recentReads: number;
}

interface ReadEvent {
  id: string;
  rfidTagId: string;
  location: string;
  readerId: string;
  readAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function RfidTagsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<RfidTag[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [readEvents, setReadEvents] = useState<ReadEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("lastRead");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  const [formEpc, setFormEpc] = useState("");
  const [formTagType, setFormTagType] = useState("STANDARD");
  const [formProductId, setFormProductId] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [bulkEpcs, setBulkEpcs] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tagRes, dashRes, readRes] = await Promise.all([
        apiGet<PaginatedResponse<RfidTag>>(
          `/inventory/rfid?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        ),
        apiGet<DashboardSummary>("/inventory/rfid/dashboard"),
        apiGet<ReadEvent[]>("/inventory/rfid/read-events?limit=5"),
      ]);
      setTags(Array.isArray(tagRes) ? tagRes : tagRes?.data || []);
      setTotalPages(tagRes?.totalPages || 1);
      setDashboard(dashRes);
      setReadEvents(Array.isArray(readRes) ? readRes : readRes || []);
    } catch (err) {
      setError("Could not load RFID data. Please try again.");
      toast.error(
        "Could not load RFID data",
        err instanceof Error ? err.message : undefined,
      );
      setTags([]);
      setDashboard({ activeTags: 0, inTransit: 0, retired: 0, recentReads: 0 });
      setReadEvents([]);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost("/inventory/rfid", {
        epc: formEpc,
        tagType: formTagType,
        productId: formProductId || undefined,
        status: formStatus,
      });
      setModalSuccess(true);
      toast.success("RFID Tag registered", `EPC: ${formEpc}`);
      setTimeout(() => {
        setShowRegisterModal(false);
        resetForm();
        loadData();
      }, 1200);
    } catch (err) {
      toast.error(
        "Could not register tag",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const epcs = bulkEpcs
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      await apiPost("/inventory/rfid/bulk", { epcs });
      setModalSuccess(true);
      toast.success("Bulk registration", `${epcs.length} tags registered`);
      setTimeout(() => {
        setShowBulkModal(false);
        setBulkEpcs("");
        setModalSuccess(false);
        loadData();
      }, 1200);
    } catch (err) {
      toast.error(
        "Could not bulk register",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTagId) return;
    setSubmitting(true);
    try {
      await apiPatch(`/inventory/rfid/${selectedTagId}/location`, {
        location: newLocation,
      });
      toast.success("Location updated");
      setShowLocationModal(false);
      setSelectedTagId(null);
      setNewLocation("");
      loadData();
    } catch (err) {
      toast.error(
        "Could not update location",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetire = async (tagId: string) => {
    if (!window.confirm("Retire this RFID tag? It cannot be re-activated."))
      return;
    try {
      await apiPatch(`/inventory/rfid/${tagId}`, { status: "RETIRED" });
      toast.success("Tag retired");
      loadData();
    } catch (err) {
      toast.error(
        "Could not retire tag",
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  const handleSortChange = (key: string, order: SortOrder) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const resetForm = () => {
    setFormEpc("");
    setFormTagType("STANDARD");
    setFormProductId("");
    setFormStatus("ACTIVE");
    setModalSuccess(false);
  };

  const kpiCards = dashboard
    ? [
        {
          icon: <Tag size={20} />,
          label: "Active Tags",
          value: dashboard.activeTags,
          color: "var(--color-success)",
        },
        {
          icon: <Radio size={20} />,
          label: "In Transit",
          value: dashboard.inTransit,
          color: "var(--color-info)",
        },
        {
          icon: <Trash2 size={20} />,
          label: "Retired",
          value: dashboard.retired,
          color: "var(--color-danger)",
        },
        {
          icon: <Activity size={20} />,
          label: "Recent Reads (24h)",
          value: dashboard.recentReads,
          color: "var(--color-primary)",
        },
      ]
    : [];

  const columns: Column<RfidTag>[] = [
    {
      key: "epc",
      header: "EPC",
      sortable: true,
      render: (t) => (
        <span className="font-mono text-xs font-semibold">{t.epc}</span>
      ),
    },
    { key: "tagType", header: "Tag Type", sortable: true },
    {
      key: "product",
      header: "Product",
      sortable: false,
      render: (t) =>
        t.product?.name || <span className="ui-text-muted">—</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: "lastLocation",
      header: "Last Location",
      sortable: true,
      render: (t) => t.lastLocation || <span className="ui-text-muted">—</span>,
    },
    {
      key: "lastRead",
      header: "Last Read",
      sortable: true,
      render: (t) =>
        t.lastRead ? (
          new Date(t.lastRead).toLocaleString()
        ) : (
          <span className="ui-text-muted">—</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      render: (t) => (
        <div className="ui-hstack-2">
          <button
            title="View read events"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTagId(t.id);
            }}
            className="ui-btn-icon ui-text-muted"
          >
            <Eye size={15} />
          </button>
          <button
            title="Update location"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTagId(t.id);
              setNewLocation(t.lastLocation || "");
              setShowLocationModal(true);
            }}
            className="ui-btn-icon ui-text-muted"
          >
            <MapPin size={15} />
          </button>
          {t.status !== "RETIRED" && (
            <button
              title="Retire"
              onClick={(e) => {
                e.stopPropagation();
                handleRetire(t.id);
              }}
              className="ui-btn-icon"
              style={{ color: "var(--color-danger)" }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <RouteGuard permission="inventory.rfid.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="RFID Tags"
          description="Register, track, and manage RFID-tagged inventory items."
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Inventory", href: "/inventory" },
            { label: "RFID Tags" },
          ]}
          actions={
            <div className="ui-hstack-2">
              <Button
                variant="secondary"
                onClick={() => {
                  resetForm();
                  setShowBulkModal(true);
                }}
                className="ui-hstack-2"
              >
                <Upload size={16} />
                <span>Bulk Register</span>
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  resetForm();
                  setShowRegisterModal(true);
                }}
                className="ui-hstack-2"
              >
                <Plus size={16} />
                <span>Register Tag</span>
              </Button>
            </div>
          }
        />

        {error && (
          <div className="rfid-error-banner">
            <Activity size={16} /> {error}
          </div>
        )}

        <div className="rfid-kpi-grid">
          {kpiCards.map((kpi, i) => (
            <Card key={i}>
              <div className="rfid-kpi-card-inner">
                <div
                  className="rfid-kpi-icon-wrapper"
                  style={{ background: kpi.color }}
                >
                  <div className="rfid-kpi-icon" style={{ color: kpi.color }}>
                    {kpi.icon}
                  </div>
                </div>
                <div>
                  <div className="rfid-kpi-label">{kpi.label}</div>
                  <div className="rfid-kpi-value">{kpi.value}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          {loading ? (
            <div className="ui-center-pad">
              <Spinner size="lg" />
            </div>
          ) : tags.length === 0 ? (
            <div className="ui-empty-state">
              <Tag size={48} className="ui-hr-faded" />
              <div className="font-semibold">No RFID Tags Found</div>
              <div className="text-sm">
                Register a tag to start tracking assets.
              </div>
            </div>
          ) : (
            <>
              <DataTable<RfidTag>
                columns={columns}
                data={tags}
                rowKey={(t) => t.id}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
              />
              {totalPages > 1 && (
                <div className="rfid-pagination">
                  <span className="text-sm ui-text-muted">
                    Page {page} of {totalPages}
                  </span>
                  <div className="ui-hstack-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {readEvents.length > 0 && (
          <Card>
            <div className="rfid-section-header">
              <h3 className="ui-heading-base">Recent Read Events</h3>
            </div>
            <div className="rfid-read-events">
              {readEvents.map((evt) => (
                <div key={evt.id} className="rfid-read-event-row">
                  <div className="rfid-read-event-loc">
                    <MapPin size={14} />
                    <span>{evt.location}</span>
                  </div>
                  <div className="text-xs ui-text-muted">
                    Reader: {evt.readerId}
                  </div>
                  <div className="text-xs ui-text-muted">
                    {new Date(evt.readAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Modal
        open={showRegisterModal}
        onClose={() => {
          setShowRegisterModal(false);
          resetForm();
        }}
        title="Register RFID Tag"
      >
        {modalSuccess ? (
          <div className="rfid-modal-success">
            <Tag size={48} className="rfid-modal-success-icon" />
            <div className="ui-heading-base">Tag Registered Successfully</div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="rfid-form">
            <FormField label="EPC" required>
              <Input
                required
                placeholder="urn:epc:id:sgtin:..."
                value={formEpc}
                onChange={(e) => setFormEpc(e.target.value)}
              />
            </FormField>
            <FormField label="Tag Type" required>
              <select
                value={formTagType}
                onChange={(e) => setFormTagType(e.target.value)}
                className="ui-input"
                style={{
                  width: "100%",
                  height: "38px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "0 var(--space-3)",
                }}
              >
                <option value="STANDARD">Standard</option>
                <option value="HIGH_TEMPERATURE">High Temperature</option>
                <option value="METAL_MOUNT">Metal Mount</option>
                <option value="FLEXIBLE">Flexible</option>
                <option value="RFID_CARD">RFID Card</option>
              </select>
            </FormField>
            <FormField label="Product ID (optional)">
              <Input
                placeholder="Linked product SKU"
                value={formProductId}
                onChange={(e) => setFormProductId(e.target.value)}
              />
            </FormField>
            <FormField label="Status" required>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="ui-input"
                style={{
                  width: "100%",
                  height: "38px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "0 var(--space-3)",
                }}
              >
                <option value="ACTIVE">Active</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="RETIRED">Retired</option>
              </select>
            </FormField>
            <div className="rfid-form-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRegisterModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? "Registering..." : "Register Tag"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={showBulkModal}
        onClose={() => {
          setShowBulkModal(false);
          setBulkEpcs("");
          setModalSuccess(false);
        }}
        title="Bulk Register Tags"
      >
        {modalSuccess ? (
          <div className="rfid-modal-success">
            <Upload size={48} className="rfid-modal-success-icon" />
            <div className="ui-heading-base">Bulk Registration Complete</div>
          </div>
        ) : (
          <form onSubmit={handleBulkRegister} className="rfid-form">
            <FormField label="EPC List" required>
              <textarea
                required
                placeholder="Enter one EPC per line&#10;urn:epc:id:sgtin:001&#10;urn:epc:id:sgtin:002"
                value={bulkEpcs}
                onChange={(e) => setBulkEpcs(e.target.value)}
                className="ui-input"
                style={{
                  width: "100%",
                  height: "140px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-2) var(--space-3)",
                  resize: "vertical",
                }}
              />
            </FormField>
            <div className="rfid-form-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkEpcs("");
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? "Registering..." : "Bulk Register"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          setSelectedTagId(null);
        }}
        title="Update Tag Location"
      >
        <form onSubmit={handleUpdateLocation} className="rfid-form">
          <FormField label="Location" required>
            <Input
              required
              placeholder="e.g. Warehouse A, Aisle 3, Bin 12"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
            />
          </FormField>
          <div className="rfid-form-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowLocationModal(false);
                setSelectedTagId(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update Location"}
            </Button>
          </div>
        </form>
      </Modal>
    </RouteGuard>
  );
}
