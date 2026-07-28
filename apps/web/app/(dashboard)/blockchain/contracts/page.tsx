"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, Button, DataTable, Modal, useToast } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import { FileCode, Plus, Trash2 } from "lucide-react";
import type { Column } from "@unerp/ui";

interface Contract {
  id: string; name: string; address: string; network: string; version: string; deployedAt: string;
}

export default function ContractsPage() {
  const { toast } = useToast();
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
    if (res.ok) { toast({ title: "Contract registered", variant: "success" }); setShowCreate(false); setForm({ name: "", address: "", network: "ethereum", version: "1.0.0" }); await fetchContracts(); }
    else toast({ title: "Failed to register contract", variant: "error" });
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/v1/blockchain/contracts/${id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Contract removed", variant: "success" }); await fetchContracts(); }
    else toast({ title: "Failed to delete contract", variant: "error" });
  };

  const columns: Column<Contract>[] = [
    { key: "name", header: "Name", render: (r) => <span className="ui-flex-row ui-gap-2"><FileCode size={14} />{r.name}</span> },
    { key: "address", header: "Address", render: (r) => <code className="u-text-xs">{r.address.substring(0, 20)}...</code> },
    { key: "network", header: "Network", render: (r) => <span className="ui-badge">{r.network}</span> },
    { key: "version", header: "Version", render: (r) => r.version },
    { key: "deployedAt", header: "Deployed", render: (r) => new Date(r.deployedAt).toLocaleDateString() },
    { key: "actions", header: "Actions", render: (r) => <Button size="sm" variant="ghost" leftIcon={<Trash2 size={14} />} onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}>Remove</Button> },
  ];

  return (
    <RouteGuard permission="blockchain.contract.read">
      <div className="ui-stack-6">
        <PageHeader title="Smart Contract Registry" description="Register and manage blockchain smart contracts." breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: "Blockchain", href: "/blockchain" }, { label: "Contracts" }]} />
        <div><Button leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Register Contract</Button></div>
        <DataTable columns={columns} data={contracts} loading={loading} />
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
