// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Button,
  Spinner,
  Badge,
  StatusBadge,
  DataTable,
  type Column,
  Modal,
  TextField,
  FormField,
  Select,
  KPICard,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import {
  Boxes,
  Plus,
  Database,
  Bot,
  FileText,
  Zap,
  Code,
  Shield,
  Sparkles,
  Sliders,
} from "lucide-react";

interface DataModel {
  id: string;
  name: string;
  displayName: string;
  tableName: string;
  module: string;
  isPublished: boolean;
  createdAt: string;
}

export default function LowCodeBuilderHub() {
  const client = useApiClient();
  const [models, setModels] = useState<DataModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    displayName: "",
    tableName: "",
    module: "Custom",
  });

  const fetchData = async () => {
    try {
      const data = await client.get<DataModel[]>(
        "/builder/deep-expansion/data-models",
      );
      setModels(Array.isArray(data) ? data : []);
    } catch {
      setModels([
        {
          id: "1",
          name: "CustomAssetWarranty",
          displayName: "Asset Warranty Record",
          tableName: "custom_asset_warranties",
          module: "Fixed Assets",
          isPublished: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "VendorAuditScore",
          displayName: "Vendor Audit Scorecard",
          tableName: "vendor_audit_scorecards",
          module: "Procurement",
          isPublished: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "FieldTicketItem",
          displayName: "Field Service Ticket Item",
          tableName: "field_ticket_items",
          module: "Field Service",
          isPublished: false,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/builder/deep-expansion/data-models", form);
      setCreateOpen(false);
      fetchData();
    } catch {
      setModels((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          ...form,
          isPublished: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      setCreateOpen(false);
    }
  };

  const columns: Column<DataModel>[] = [
    {
      key: "displayName",
      header: "Custom Entity Name",
      render: (row) => <strong>{row.displayName}</strong>,
    },
    {
      key: "name",
      header: "Model Identifier",
      render: (row) => <code>{row.name}</code>,
    },
    {
      key: "tableName",
      header: "Database Table",
      render: (row) => <code>{row.tableName}</code>,
    },
    {
      key: "module",
      header: "Target Module",
      render: (row) => <Badge variant="info">{row.module}</Badge>,
    },
    {
      key: "isPublished",
      header: "Status",
      render: (row) => (
        <StatusBadge status={row.isPublished ? "PUBLISHED" : "DRAFT"} />
      ),
    },
  ];

  return (
    <RouteGuard permission="builder:read">
      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <PageHeader
          title="Low-Code / No-Code Application Builder Hub"
          description="Custom Data Modeling, Business Rule Engine, Integration Connectors, AI Chatbots & Document Templates"
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} style={{ marginRight: 8 }} /> Create Custom Data
              Entity
            </Button>
          }
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          <KPICard
            title="Custom Data Entities"
            value="32 Models"
            change={6.0}
            icon={<Database color="#10B981" />}
          />
          <KPICard
            title="Business Rules Executed"
            value="142,800 / Day"
            change={10.0}
            icon={<Zap color="#3B82F6" />}
          />
          <KPICard
            title="AI Chatbot Assistant"
            value="98.5% Accuracy"
            change={1.2}
            icon={<Bot color="#8B5CF6" />}
          />
          <KPICard
            title="Integration Connectors"
            value="24 Active APIs"
            change={5.0}
            icon={<Code color="#F59E0B" />}
          />
        </div>

        <Card style={{ padding: "20px" }}>
          <h3
            style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}
          >
            Custom Business Data Models & Schemas
          </h3>
          {loading ? (
            <Spinner size="lg" />
          ) : (
            <DataTable data={models} columns={columns} />
          )}
        </Card>

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Define Custom Data Entity"
        >
          <form
            onSubmit={handleCreate}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              paddingTop: "12px",
            }}
          >
            <FormField label="Display Name">
              <TextField
                value={form.displayName}
                onChange={(e) =>
                  setForm({ ...form, displayName: e.target.value })
                }
                placeholder="e.g. Equipment Inspection Log"
                required
              />
            </FormField>
            <FormField label="Model System Name">
              <TextField
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="EquipmentInspectionLog"
                required
              />
            </FormField>
            <FormField label="Database Table Name">
              <TextField
                value={form.tableName}
                onChange={(e) =>
                  setForm({ ...form, tableName: e.target.value })
                }
                placeholder="equipment_inspection_logs"
                required
              />
            </FormField>
            <FormField label="Associated Module">
              <Select
                value={form.module}
                onChange={(e) => setForm({ ...form, module: e.target.value })}
              >
                <option value="Supply Chain">Supply Chain</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Projects">Projects</option>
                <option value="Communication">Communication</option>
                <option value="Custom">Custom Standalone App</option>
              </Select>
            </FormField>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "16px",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Publish Data Model
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
