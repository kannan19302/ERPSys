"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, Button, DataTable, Modal, toast } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import { FileCode, Plus, Trash2 } from "lucide-react";
import type { Column } from "@unerp/ui";

interface Contract {
  id: string; name: string; address: string; network: string; version: string; deployedAt: string;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", network: "ethereum", version: "1.0.0" });

  const fetchContracts = useCallback(async () => {
    const res = await fetch("/api/v1/blockchain/contracts");
    if (res.ok) setContracts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const handleCreate = async () => {
    const res = await fetch("/api/v1/blockchain/contracts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("Contract registered"); setShowCreate(false); setForm({ name: "", address: "", network: "ethereum", version: "1.0.0" }); await fetchContracts(); }
    else toast.error("Failed to register contract");
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/v1/blockchain/contracts/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Contract removed"); await fetchContracts(); }
    else toast.error("Failed to delete contract");
  };

  const columns: Column<Contract>[] = [
    { id: "name", header: "Name", render: (r) => <span className="ui-flex-row ui-gap-2"><FileCode size={14} />{r.name}</span> },
    { id: "address", header: "Address", render: (r) => <code className="u-text-xs">{r.address.substring(0, 20)}...</code> },
    { id: "network", header: "Network", render: (r) => <span className="ui-badge">{r.network}</span> },
    { id: "version", header: "Version", render: (r) => r.version },
    { id: "deployedAt", header: "Deployed", render: (r) => new Date(r.deployedAt).toLocaleDateString() },
    { id: "actions", header: "Actions", render: (r) => <Button size="sm" variant="ghost" leftIcon={<Trash2 size={14} />} onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}>Remove</Button> },
  ];

  return (
    <RouteGuard permission="blockchain.contract.read">
      <div className="ui-stack-6">
        <PageHeader title="Smart Contract Registry" description="Register and manage blockchain smart contracts." icon={FileCode} breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: "Blockchain", href: "/blockchain" }, { label: "Contracts" }]} />
        <div><Button leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Register Contract</Button></div>
        <DataTable columns={columns} data={contracts} loading={loading} sortable />
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Register Smart Contract">
          <div className="ui-form-group">
            {["name", "address", "network", "version"].map((f) => (
              <div key={f} className="ui-form-group">
                <label className="ui-label">{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                <input className="ui-input" value={(form as any)[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} placeholder={f} />
              </div>
            ))}
            <div className="ui-flex-row ui-gap-4 u-mt-4">
              <Button onClick={handleCreate} disabled={!form.name || !form.address}>Register</Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      </div>
    </RouteGuard>
  );
}
