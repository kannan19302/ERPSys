"use client";
import React, { useState, useEffect } from "react";
import { Brain, Plus, X, Loader2 } from "lucide-react";
import { useApiClient } from "@unerp/framework";
import { Card, Button } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";

interface NluExample {
  id: string;
  intent: string;
  text: string;
  language: string;
  entities: {
    id: string;
    entity: string;
    value: string;
    startPos: number | null;
    endPos: number | null;
  }[];
}

export default function TrainingPage() {
  const client = useApiClient();
  const [data, setData] = useState<NluExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<NluExample | null>(null);
  const [newItem, setNewItem] = useState({
    intent: "",
    text: "",
    language: "en",
    entityName: "",
    entityValue: "",
  });

  useEffect(() => {
    fetchData();
  }, [client]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const r = await client.get<{ data: NluExample[]; meta: unknown }>(
        "/ai/nlu/training-data",
      );
      setData(r.data || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const saveItem = async () => {
    if (!newItem.intent || !newItem.text) return;
    try {
      await client.post("/ai/nlu/training-data", newItem);
      setIsModalOpen(false);
      setNewItem({
        intent: "",
        text: "",
        language: "en",
        entityName: "",
        entityValue: "",
      });
      fetchData();
    } catch {
      /* ignore */
    }
  };

  const updateItem = async () => {
    if (!editItem) return;
    try {
      await client.put(`/ai/nlu/training-data/${editItem.id}`, {
        intent: editItem.intent,
        text: editItem.text,
        language: editItem.language,
      });
      setIsEditModalOpen(false);
      setEditItem(null);
      fetchData();
    } catch {
      /* ignore */
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await client.delete(`/ai/nlu/training-data/${id}`);
      fetchData();
    } catch {
      /* ignore */
    }
  };

  return (
    <RouteGuard permission="ai.nlu-training.read">
      <div className="p-8 ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl ui-hstack-3">
              <Brain size={28} className="ui-text-primary" /> NLU Training Data
            </h1>
            <p className="ui-text-muted mt-1">
              Manage NLU training examples for intent recognition
            </p>
          </div>
          <Button
            leftIcon={<Plus size={16} />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Example
          </Button>
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="ui-flex-center p-8">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : (
            <div className="ui-stack-3">
              {data.map((item) => (
                <div
                  key={item.id}
                  className="ui-flex ui-gap-3 ui-items-start p-3 ui-bg-subtle rounded-lg"
                >
                  <div className="flex-1">
                    <div className="ui-hstack-2">
                      <span className="ui-badge-primary text-xs px-2 py-0.5 rounded">
                        {item.intent}
                      </span>
                      <span className="ui-text-xs-muted">{item.language}</span>
                    </div>
                    <p className="text-sm mt-1">{item.text}</p>
                    {item.entities?.length > 0 && (
                      <div className="ui-hstack-2 mt-1">
                        {item.entities.map((e, i) => (
                          <span
                            key={i}
                            className="ui-badge-info text-xs px-2 py-0.5 rounded"
                          >
                            {e.entity}: {e.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ui-hstack-2">
                    <button
                      onClick={() => {
                        setEditItem(item);
                        setIsEditModalOpen(true);
                      }}
                      className="ui-btn-icon text-sm ui-text-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="ui-btn-icon ui-text-danger"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {data.length === 0 && (
                <p className="ui-text-muted text-sm">No training examples.</p>
              )}
            </div>
          )}
        </Card>

        {isModalOpen && (
          <div className="fixed inset-0 ui-bg-overlay flex items-center justify-center z-50">
            <Card className="w-full max-w-lg p-6 ui-stack-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add NLU Example</h3>
                <button onClick={() => setIsModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <input
                className="ui-input"
                placeholder="Intent"
                value={newItem.intent}
                onChange={(e) =>
                  setNewItem({ ...newItem, intent: e.target.value })
                }
              />
              <textarea
                className="ui-textarea"
                placeholder="Example text"
                rows={3}
                value={newItem.text}
                onChange={(e) =>
                  setNewItem({ ...newItem, text: e.target.value })
                }
              />
              <input
                className="ui-input"
                placeholder="Language"
                value={newItem.language}
                onChange={(e) =>
                  setNewItem({ ...newItem, language: e.target.value })
                }
              />
              <div className="ui-flex ui-gap-3 ui-justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={saveItem}>Save</Button>
              </div>
            </Card>
          </div>
        )}

        {isEditModalOpen && editItem && (
          <div className="fixed inset-0 ui-bg-overlay flex items-center justify-center z-50">
            <Card className="w-full max-w-lg p-6 ui-stack-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit NLU Example</h3>
                <button onClick={() => setIsEditModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <input
                className="ui-input"
                placeholder="Intent"
                value={editItem.intent}
                onChange={(e) =>
                  setEditItem({ ...editItem, intent: e.target.value })
                }
              />
              <textarea
                className="ui-textarea"
                placeholder="Example text"
                rows={3}
                value={editItem.text}
                onChange={(e) =>
                  setEditItem({ ...editItem, text: e.target.value })
                }
              />
              <div className="ui-flex ui-gap-3 ui-justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={updateItem}>Update</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
