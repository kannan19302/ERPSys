'use client';
import styles from './page.module.css';
import { useState, useEffect, useCallback } from 'react';
import { ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

type Tab = 'dashboard' | 'doors' | 'appointments' | 'moves' | 'yard-inventory';

interface Dashboard {
  doors: { total: number; available: number; occupied: number };
  appointments: { total: number; scheduled: number; checkedIn: number; loading: number; todayComplete: number };
  pendingMoves: number;
  yardTrailers: number;
}

interface DockDoor {
  id: string; doorNumber: string; doorType: string; status: string; warehouseId: string; notes?: string;
  _count?: { appointments: number };
}

interface YardAppointment {
  id: string; appointmentNumber: string; status: string; appointmentType: string;
  scheduledAt: string; carrierName?: string; driverName?: string; truckPlate?: string;
  trailerNumber?: string; referenceNumber?: string; dockDoorId?: string;
  warehouseId: string;
  dockDoor?: { doorNumber: string };
  gatePass?: { passNumber: string; gateInAt?: string; gateOutAt?: string } | null;
}

interface YardMove {
  id: string; trailerNumber: string; fromLocation: string; toLocation: string;
  status: string; assignedTo?: string; warehouseId: string;
}

interface YardInventoryItem {
  id: string; trailerNumber: string; location: string; description?: string;
  qty?: string; uom?: string; warehouseId: string; arrivedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  OCCUPIED: 'bg-red-100 text-red-700',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  CHECKED_IN: 'bg-purple-100 text-purple-700',
  LOADING: 'bg-orange-100 text-orange-700',
  COMPLETE: 'bg-green-100 text-green-700',
  NO_SHOW: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
};

export default function YardManagementPage() {
  const client = useApiClient();
  const apiFetch = useCallback(<T,>(path: string, opts?: RequestInit) => client.request<T>(path, {
    method: opts?.method,
    body: opts?.body ? String(opts.body) : undefined,
  }), [client]);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [doors, setDoors] = useState<DockDoor[]>([]);
  const [appointments, setAppointments] = useState<YardAppointment[]>([]);
  const [moves, setMoves] = useState<YardMove[]>([]);
  const [yardInventory, setYardInventory] = useState<YardInventoryItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDoorForm, setShowDoorForm] = useState(false);
  const [showApptForm, setShowApptForm] = useState(false);
  const [showMoveForm, setShowMoveForm] = useState(false);
  const [doorForm, setDoorForm] = useState({ warehouseId: '', doorNumber: '', doorType: 'DUAL', notes: '' });
  const [apptForm, setApptForm] = useState({
    warehouseId: '', scheduledAt: '', appointmentType: 'INBOUND',
    carrierName: '', driverName: '', truckPlate: '', trailerNumber: '', referenceNumber: '', notes: '',
  });
  const [moveForm, setMoveForm] = useState({
    warehouseId: '', trailerNumber: '', fromLocation: '', toLocation: '', assignedTo: '', notes: '',
  });

  const loadDashboard = useCallback(async () => {
    try { setDashboard(await apiFetch('/inventory/yard-management/dashboard')); } catch { /* ignore */ }
  }, []);

  const loadDoors = useCallback(async () => {
    setLoading(true);
    try { setDoors(await apiFetch('/inventory/yard-management/dock-doors')); }
    catch (e: unknown) { setError(String(e)); } finally { setLoading(false); }
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try { setAppointments(await apiFetch('/inventory/yard-management/appointments')); }
    catch (e: unknown) { setError(String(e)); } finally { setLoading(false); }
  }, []);

  const loadMoves = useCallback(async () => {
    setLoading(true);
    try { setMoves(await apiFetch('/inventory/yard-management/yard-moves')); }
    catch (e: unknown) { setError(String(e)); } finally { setLoading(false); }
  }, []);

  const loadYardInventory = useCallback(async () => {
    setLoading(true);
    try { setYardInventory(await apiFetch('/inventory/yard-management/yard-inventory')); }
    catch (e: unknown) { setError(String(e)); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => {
    if (tab === 'doors') loadDoors();
    else if (tab === 'appointments') loadAppointments();
    else if (tab === 'moves') loadMoves();
    else if (tab === 'yard-inventory') loadYardInventory();
  }, [tab, loadDoors, loadAppointments, loadMoves, loadYardInventory]);

  const createDoor = async () => {
    try {
      await apiFetch('/inventory/yard-management/dock-doors', { method: 'POST', body: JSON.stringify(doorForm) });
      setShowDoorForm(false); loadDoors(); loadDashboard();
    } catch (e: unknown) { setError(String(e)); }
  };

  const createAppt = async () => {
    try {
      await apiFetch('/inventory/yard-management/appointments', { method: 'POST', body: JSON.stringify(apptForm) });
      setShowApptForm(false); loadAppointments(); loadDashboard();
    } catch (e: unknown) { setError(String(e)); }
  };

  const createMove = async () => {
    try {
      await apiFetch('/inventory/yard-management/yard-moves', { method: 'POST', body: JSON.stringify(moveForm) });
      setShowMoveForm(false); loadMoves(); loadDashboard();
    } catch (e: unknown) { setError(String(e)); }
  };

  const apptAction = async (id: string, action: string, body?: unknown) => {
    try {
      await apiFetch(`/inventory/yard-management/appointments/${id}/${action}`, {
        method: 'PATCH', ...(body ? { body: JSON.stringify(body) } : {}),
      });
      loadAppointments(); loadDoors(); loadDashboard();
    } catch (e: unknown) { setError(String(e)); }
  };

  const moveAction = async (id: string, action: string) => {
    try {
      await apiFetch(`/inventory/yard-management/yard-moves/${id}/${action}`, { method: 'PATCH' });
      loadMoves(); loadDashboard();
    } catch (e: unknown) { setError(String(e)); }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'doors', label: 'Dock Doors' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'moves', label: 'Yard Moves' },
    { id: 'yard-inventory', label: 'Yard Inventory' },
  ];

  return (
    <RouteGuard permission="inventory.yard-management.read">
      <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Yard Management</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}<button className="ml-2 underline" onClick={() => setError('')}>dismiss</button>
        </div>
      )}

      <div className="flex gap-2 border-b mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Available Doors', value: dashboard.doors.available, sub: `${dashboard.doors.total} total` },
              { label: 'Occupied Doors', value: dashboard.doors.occupied, sub: 'loading/unloading' },
              { label: 'Active Appointments', value: dashboard.appointments.checkedIn + dashboard.appointments.loading, sub: `${dashboard.appointments.scheduled} scheduled` },
              { label: 'Yard Trailers', value: dashboard.yardTrailers, sub: `${dashboard.pendingMoves} pending moves` },
            ].map(c => (
              <div key={c.label} className="bg-white border rounded-lg p-4">
                <div className="text-2xl font-bold">{c.value}</div>
                <div className="text-sm text-gray-700 mt-0.5">{c.label}</div>
                <div className="text-xs text-gray-400 mt-1">{c.sub}</div>
              </div>
            ))}
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">Appointment Status</h3>
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: 'Scheduled', value: dashboard.appointments.scheduled, color: 'bg-blue-50 text-blue-700' },
                { label: 'Checked In', value: dashboard.appointments.checkedIn, color: 'bg-purple-50 text-purple-700' },
                { label: 'Loading', value: dashboard.appointments.loading, color: 'bg-orange-50 text-orange-700' },
                { label: 'Today Completed', value: dashboard.appointments.todayComplete, color: 'bg-green-50 text-green-700' },
                { label: 'Total', value: dashboard.appointments.total, color: 'bg-gray-50 text-gray-700' },
              ].map(s => (
                <div key={s.label} className={`rounded-lg p-3 text-center ${s.color}`}>
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dock Doors */}
      {tab === 'doors' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-medium">Dock Doors</h2>
            <button onClick={() => setShowDoorForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">+ Add Door</button>
          </div>

          {showDoorForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">Add Dock Door</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <input placeholder="Warehouse ID*" value={doorForm.warehouseId} onChange={e => setDoorForm(f => ({ ...f, warehouseId: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="Door Number*" value={doorForm.doorNumber} onChange={e => setDoorForm(f => ({ ...f, doorNumber: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <select value={doorForm.doorType} onChange={e => setDoorForm(f => ({ ...f, doorType: e.target.value }))} className="border rounded px-3 py-2 text-sm">
                  {['INBOUND', 'OUTBOUND', 'DUAL'].map(t => <option key={t}>{t}</option>)}
                </select>
                <input placeholder="Notes" value={doorForm.notes} onChange={e => setDoorForm(f => ({ ...f, notes: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={createDoor} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Create</button>
                <button onClick={() => setShowDoorForm(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              </div>
            </div>
          )}

          {loading ? <div className="text-gray-500">Loading...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {doors.map(d => (
                <div key={d.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono font-medium text-lg">Door {d.doorNumber}</div>
                      <div className="text-sm text-gray-500">{d.doorType} · {d.warehouseId.slice(0, 8)}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[d.status] ?? 'bg-gray-100'}`}>{d.status}</span>
                  </div>
                  {d.notes && <div className="mt-2 text-xs text-gray-500">{d.notes}</div>}
                  <div className="mt-2 text-xs text-gray-400">{d._count?.appointments ?? 0} appointments</div>
                </div>
              ))}
              {doors.length === 0 && <div className="col-span-3 text-center text-gray-400 py-8">No dock doors configured</div>}
            </div>
          )}
        </div>
      )}

      {/* Appointments */}
      {tab === 'appointments' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-medium">Yard Appointments</h2>
            <button onClick={() => setShowApptForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">+ New Appointment</button>
          </div>

          {showApptForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">Create Appointment</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <input placeholder="Warehouse ID*" value={apptForm.warehouseId} onChange={e => setApptForm(f => ({ ...f, warehouseId: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input type="datetime-local" value={apptForm.scheduledAt} onChange={e => setApptForm(f => ({ ...f, scheduledAt: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <select value={apptForm.appointmentType} onChange={e => setApptForm(f => ({ ...f, appointmentType: e.target.value }))} className="border rounded px-3 py-2 text-sm">
                  {['INBOUND', 'OUTBOUND'].map(t => <option key={t}>{t}</option>)}
                </select>
                <input placeholder="Carrier Name" value={apptForm.carrierName} onChange={e => setApptForm(f => ({ ...f, carrierName: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="Driver Name" value={apptForm.driverName} onChange={e => setApptForm(f => ({ ...f, driverName: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="Truck Plate" value={apptForm.truckPlate} onChange={e => setApptForm(f => ({ ...f, truckPlate: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="Trailer #" value={apptForm.trailerNumber} onChange={e => setApptForm(f => ({ ...f, trailerNumber: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="Reference # (PO/SO/TO)" value={apptForm.referenceNumber} onChange={e => setApptForm(f => ({ ...f, referenceNumber: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={createAppt} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Create</button>
                <button onClick={() => setShowApptForm(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              </div>
            </div>
          )}

          <ListPageTemplate
            columns={[
              { key: 'appointmentNumber', header: 'Appt #', render: (v) => <span className="font-mono">{String(v)}</span> },
              { key: 'appointmentType', header: 'Type', render: (v) => <span className={`px-2 py-0.5 rounded text-xs ${v === 'INBOUND' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{String(v)}</span> },
              { key: 'carrierName', header: 'Carrier', render: (v) => String(v ?? '-') },
              { key: 'trailerNumber', header: 'Trailer', render: (v) => <span className="font-mono text-xs">{String(v ?? '-')}</span> },
              { key: 'scheduledAt', header: 'Scheduled', render: (v) => new Date(String(v)).toLocaleString() },
              { key: 'dockDoor', header: 'Door', render: (v) => String((v as any)?.doorNumber ?? '-') },
              { key: 'status', header: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[String(v)] ?? ''}`}>{String(v)}</span> },
              { key: 'gatePass', header: 'Gate Pass', render: (v) => v ? `✓ ${(v as any).passNumber}` : '-' },
              { key: 'id', header: 'Actions', render: (v, row) => (
                <div className={styles.s1}>
                  {row.status === 'SCHEDULED' && <>
                    <button onClick={() => apptAction(String(v), 'check-in', {})} className="text-purple-600 underline text-xs">Check In</button>
                    <button onClick={() => apptAction(String(v), 'no-show')} className="text-gray-500 underline text-xs">No Show</button>
                    <button onClick={() => apptAction(String(v), 'cancel')} className="text-red-600 underline text-xs">Cancel</button>
                  </>}
                  {row.status === 'CHECKED_IN' && <>
                    <button onClick={() => apptAction(String(v), 'start-loading')} className="text-orange-600 underline text-xs">Start Loading</button>
                    <button onClick={() => apptAction(String(v), 'complete', {})} className="text-green-600 underline text-xs">Complete</button>
                  </>}
                  {row.status === 'LOADING' && <button onClick={() => apptAction(String(v), 'complete', {})} className="text-green-600 underline text-xs">Complete</button>}
                </div>
              ) },
            ] as ListColumn[]}
            data={appointments as unknown as Record<string, unknown>[]}
            loading={loading}
            emptyTitle="No appointments"
            emptyDescription="No yard appointments found."
          />
        </div>
      )}

      {/* Yard Moves */}
      {tab === 'moves' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-medium">Yard Moves</h2>
            <button onClick={() => setShowMoveForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">+ New Move</button>
          </div>

          {showMoveForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">Create Yard Move</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                <input placeholder="Warehouse ID*" value={moveForm.warehouseId} onChange={e => setMoveForm(f => ({ ...f, warehouseId: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="Trailer #*" value={moveForm.trailerNumber} onChange={e => setMoveForm(f => ({ ...f, trailerNumber: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="From Location*" value={moveForm.fromLocation} onChange={e => setMoveForm(f => ({ ...f, fromLocation: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="To Location*" value={moveForm.toLocation} onChange={e => setMoveForm(f => ({ ...f, toLocation: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="Assigned To" value={moveForm.assignedTo} onChange={e => setMoveForm(f => ({ ...f, assignedTo: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={createMove} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Create</button>
                <button onClick={() => setShowMoveForm(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              </div>
            </div>
          )}

          {loading ? <div className="text-gray-500">Loading...</div> : (
            <div className="space-y-3">
              {moves.map(m => (
                <div key={m.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="font-mono font-medium">{m.trailerNumber}</div>
                    <div className="text-sm text-gray-600">{m.fromLocation} → {m.toLocation}</div>
                    {m.assignedTo && <div className="text-xs text-gray-400 mt-1">Assigned: {m.assignedTo}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[m.status] ?? ''}`}>{m.status}</span>
                    {m.status === 'PENDING' && <button onClick={() => moveAction(m.id, 'start')} className="text-blue-600 underline text-xs">Start</button>}
                    {m.status === 'IN_PROGRESS' && <button onClick={() => moveAction(m.id, 'complete')} className="text-green-600 underline text-xs">Complete</button>}
                    {!['COMPLETE', 'CANCELLED'].includes(m.status) && <button onClick={() => moveAction(m.id, 'cancel')} className="text-red-600 underline text-xs">Cancel</button>}
                  </div>
                </div>
              ))}
              {moves.length === 0 && <div className="text-center text-gray-400 py-8">No yard moves</div>}
            </div>
          )}
        </div>
      )}

      {/* Yard Inventory */}
      {tab === 'yard-inventory' && (
        <div>
          <h2 className="text-lg font-medium mb-4">Yard Inventory (Trailers on Site)</h2>
          <ListPageTemplate
            columns={[
              { key: 'trailerNumber', header: 'Trailer #', render: (v) => <span className="font-mono">{String(v)}</span> },
              { key: 'location', header: 'Location' },
              { key: 'description', header: 'Description', render: (v) => String(v ?? '-') },
              { key: 'qty', header: 'Qty', render: (v, row) => v ? `${v} ${row.uom ?? ''}` : '-' },
              { key: 'arrivedAt', header: 'Arrived', render: (v) => new Date(String(v)).toLocaleDateString() },
              { key: 'id', header: 'Actions', render: (v) => (
                <button onClick={async () => {
                  try {
                    await apiFetch(`/inventory/yard-management/yard-inventory/${v}/depart`, { method: 'PATCH' });
                    loadYardInventory();
                  } catch (e: unknown) { setError(String(e)); }
                }} className="text-gray-600 underline text-xs">Mark Departed</button>
              ) },
            ] as ListColumn[]}
            data={yardInventory as unknown as Record<string, unknown>[]}
            loading={loading}
            emptyTitle="No trailers in yard"
            emptyDescription="No trailers currently in yard inventory."
          />
        </div>
      )}
      </div>
    </RouteGuard>
  );
}
