"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import {
  PageHeader,
  Button,
  Card,
  Spinner,
  DataTable,
  Modal,
  FormField,
} from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";

interface JourneyStage {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function JourneyStagesPage() {
  const [stages, setStages] = useState<JourneyStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStage, setEditingStage] = useState<JourneyStage | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    icon: "",
    sortOrder: 0,
  });

  const loadStages = async () => {
    try {
      const res = await fetch("/api/crm/customer-journey/stages");
      const data = await res.json();
      setStages(Array.isArray(data) ? data : []);
    } catch {
      setStages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStages();
  }, []);

  const handleSave = async () => {
    const url = editingStage
      ? `/api/crm/customer-journey/stages/${editingStage.id}`
      : "/api/crm/customer-journey/stages";
    const method = editingStage ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setShowModal(false);
    setEditingStage(null);
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6",
      icon: "",
      sortOrder: 0,
    });
    loadStages();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this stage?")) return;
    await fetch(`/api/crm/customer-journey/stages/${id}`, { method: "DELETE" });
    loadStages();
  };

  const openEdit = (stage: JourneyStage) => {
    setEditingStage(stage);
    setFormData({
      name: stage.name,
      description: stage.description || "",
      color: stage.color,
      icon: stage.icon || "",
      sortOrder: stage.sortOrder,
    });
    setShowModal(true);
  };

  return (
    <RouteGuard permission="crm.customer-journey.stages.read">
      <div>
        <PageHeader
          title="Journey Stages"
          description="Configure customer journey lifecycle stages"
          actions={
            <Button
              onClick={() => {
                setEditingStage(null);
                setFormData({
                  name: "",
                  description: "",
                  color: "#3b82f6",
                  icon: "",
                  sortOrder: stages.length,
                });
                setShowModal(true);
              }}
            >
              <Plus className="ui-w-4 ui-h-4 ui-mr-1" /> Add Stage
            </Button>
          }
        />

        {loading ? (
          <div className="ui-flex ui-justify-center ui-py-20">
            <Spinner />
          </div>
        ) : (
          <Card className="ui-p-0">
            <DataTable<any>
              columns={[
                { header: "Order", key: "sortOrder" },
                { header: "Name", key: "name" },
                {
                  header: "Color",
                  key: "color",
                  render: (_v: any, row: JourneyStage) => (
                    <div className="ui-flex ui-items-center ui-gap-2">
                      <div
                        className="ui-w-5 ui-h-5 ui-rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="ui-text-sm ui-text-gray-500">
                        {row.color}
                      </span>
                    </div>
                  ),
                },
                { header: "Icon", key: "icon" },
                {
                  header: "Active",
                  key: "isActive",
                  render: (_v: any, row: JourneyStage) =>
                    row.isActive ? "Yes" : "No",
                },
                {
                  header: "Actions",
                  key: "id",
                  render: (_v: any, row: JourneyStage) => (
                    <div className="ui-flex ui-gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(row);
                        }}
                        className="ui-p-1 hover:ui-text-blue-600"
                      >
                        <Pencil className="ui-w-4 ui-h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(row.id);
                        }}
                        className="ui-p-1 hover:ui-text-red-600"
                      >
                        <Trash2 className="ui-w-4 ui-h-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={stages}
            />
          </Card>
        )}

        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title={editingStage ? "Edit Stage" : "Add Stage"}
        >
          <div className="ui-space-y-4">
            <FormField label="Name" error="">
              <input
                className="ui-input"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Onboarding"
              />
            </FormField>
            <FormField label="Description" error="">
              <textarea
                className="ui-input"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </FormField>
            <div className="ui-grid-2">
              <FormField label="Color" error="">
                <div className="ui-flex ui-items-center ui-gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="ui-w-10 ui-h-10"
                  />
                  <span className="ui-text-sm">{formData.color}</span>
                </div>
              </FormField>
              <FormField label="Sort Order" error="">
                <input
                  type="number"
                  className="ui-input"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: Number(e.target.value),
                    })
                  }
                />
              </FormField>
            </div>
            <FormField label="Icon (lucide name)" error="">
              <input
                className="ui-input"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                placeholder="e.g. user-plus"
              />
            </FormField>
            <div className="ui-flex ui-justify-end ui-gap-2 ui-pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingStage ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </RouteGuard>
  );
}
