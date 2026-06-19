'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  MarkerType,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  ArrowLeft, Save, Play, Pause, Settings, Bell, Mail, Split, GitMerge, CheckSquare,
  Clock, Link2, BoxSelect, Trash2
} from 'lucide-react';
import { useToast } from '@/components/builder/ToastProvider';

const initialNodes: Node[] = [
  { id: '1', type: 'input', position: { x: 250, y: 50 }, data: { label: 'Trigger: Manual' } }
];

const initialEdges: Edge[] = [];

let id = 10;
const getId = () => `dndnode_${id++}`;

const NODE_TYPES = [
  { type: 'approval', label: 'Approval Step', icon: CheckSquare, color: '#10b981' },
  { type: 'email', label: 'Send Email', icon: Mail, color: '#3b82f6' },
  { type: 'notification', label: 'In-App Alert', icon: Bell, color: '#f59e0b' },
  { type: 'condition', label: 'Condition', icon: Split, color: '#8b5cf6' },
  { type: 'delay', label: 'Wait/Delay', icon: Clock, color: '#64748b' },
  { type: 'webhook', label: 'Webhook', icon: Link2, color: '#ec4899' },
];

function CustomNode({ data, isConnectable }: any) {
  const nt = NODE_TYPES.find(n => n.type === data.nodeType);
  const Icon = nt?.icon || BoxSelect;
  const color = nt?.color || '#94a3b8';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'white', border: `1px solid ${color}`, borderRadius: '8px', minWidth: '180px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} style={{ background: color, width: '8px', height: '8px' }} />
      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '10px', fontWeight: 'bold', color: color, textTransform: 'uppercase' }}>{nt?.label || 'Node'}</div>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{data.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} style={{ background: color, width: '8px', height: '8px' }} />
    </div>
  );
}

const customNodeTypes = {
  custom: CustomNode,
};

function WorkflowEditor() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadWorkflow() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/v1/builder/workflows/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          setWorkflow(data);
          if (data.nodes && data.nodes.length > 0) {
            setNodes(data.nodes);
            setEdges(data.edges || []);
          } else {
            // Setup default trigger node
            setNodes([{
              id: 'trigger-1', type: 'input', position: { x: 250, y: 50 },
              data: { label: `Trigger: ${data.trigger}` },
              style: { border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px' }
            }]);
          }
        } else {
          showToast('Failed to load workflow', 'error');
        }
      } catch (err) {
        if (isMounted) showToast('Network error loading workflow', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadWorkflow();
    return () => { isMounted = false; };
  }, [params.id, setNodes, setEdges, showToast]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)), [setEdges]);

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, label }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const nodeDataStr = event.dataTransfer.getData('application/reactflow');
      
      if (!nodeDataStr || !reactFlowBounds || !reactFlowInstance) return;
      
      const nodeData = JSON.parse(nodeDataStr);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getId(),
        type: 'custom',
        position,
        data: { label: nodeData.label, nodeType: nodeData.type, config: {} },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onSelectionChange = useCallback((params: any) => {
    if (params.nodes.length > 0) {
      setSelectedNode(nodes.find(n => n.id === params.nodes[0].id) || null);
    } else {
      setSelectedNode(null);
    }
  }, [nodes]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token') || '';
      const payload = {
        nodes,
        edges,
        name: workflow?.name || 'Untitled',
      };
      const res = await fetch(`/api/v1/builder/workflows/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Workflow saved successfully', 'success');
      } else {
        showToast('Failed to save workflow', 'error');
      }
    } catch (err) {
      showToast('Network error saving workflow', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const updateNodeData = (key: string, value: any) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNode.id) {
          const newData = { ...n.data, [key]: value };
          setSelectedNode({ ...n, data: newData });
          return { ...n, data: newData };
        }
        return n;
      })
    );
  };

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [executions, setExecutions] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchExecutions = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/builder/workflows/${params.id}/executions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExecutions(data);
      }
    } catch { /* ignore */ }
  };

  const handleTestRun = async () => {
    setIsExecuting(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/builder/workflows/${params.id}/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Workflow triggered successfully', 'success');
        fetchExecutions();
        setIsHistoryModalOpen(true);
      } else {
        showToast('Failed to trigger workflow', 'error');
      }
    } catch {
      showToast('Network error triggering workflow', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading editor...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 9999, backgroundColor: '#f8fafc', color: '#0f172a', overflow: 'hidden' }}>
      
      {/* Top Navbar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-4)', height: '60px', background: 'white', borderBottom: '1px solid #e2e8f0', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button onClick={() => router.push('/builder/erp/workflows')} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={16} color="#64748b" />
          </button>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>{workflow?.name || 'Workflow Editor'}</h1>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{workflow?.status || 'DRAFT'} · {nodes.length} nodes</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { fetchExecutions(); setIsHistoryModalOpen(true); }} style={{ padding: '8px 16px', borderRadius: '6px', background: 'white', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
            <Clock size={14} /> History
          </button>
          <button onClick={handleTestRun} disabled={isExecuting} style={{ padding: '8px 16px', borderRadius: '6px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
            {isExecuting ? <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> : <Play size={14} />}
            <span>Test Run</span>
          </button>
          <button onClick={handleSave} disabled={isSaving} style={{ padding: '8px 16px', borderRadius: '6px', background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
            {isSaving ? <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> : <Save size={14} />}
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Palette */}
        <div style={{ width: '240px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '16px 16px 8px 16px', borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Node Types</span>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            {NODE_TYPES.map(nt => (
              <div
                key={nt.type}
                onDragStart={(event) => onDragStart(event, nt.type, nt.label)}
                draggable
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'white',
                  border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'grab', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <nt.icon size={16} color={nt.color} />
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>{nt.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center Canvas */}
        <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={customNodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onSelectionChange={onSelectionChange}
            fitView
            attributionPosition="bottom-right"
          >
            <Controls />
            <MiniMap style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }} />
            <Background color="#cbd5e1" gap={16} />
          </ReactFlow>
        </div>

        {/* Right Properties Panel */}
        <div style={{ width: '300px', background: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} color="#64748b" />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Properties</span>
          </div>
          
          <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
            {selectedNode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>Node Label</label>
                  <input 
                    type="text" 
                    value={selectedNode.data.label as string} 
                    onChange={(e) => updateNodeData('label', e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                
                {selectedNode.data.nodeType === 'email' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>To Email / Field</label>
                      <input type="text" value={(selectedNode.data.config as any)?.toEmail || ''} onChange={(e) => updateNodeData('config', { ...(selectedNode.data.config as any), toEmail: e.target.value })} placeholder="e.g. {{user.email}}" style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>Subject</label>
                      <input type="text" value={(selectedNode.data.config as any)?.subject || ''} onChange={(e) => updateNodeData('config', { ...(selectedNode.data.config as any), subject: e.target.value })} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                  </>
                )}

                {selectedNode.data.nodeType === 'approval' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>Assign To Role</label>
                    <select value={(selectedNode.data.config as any)?.assignRole || ''} onChange={(e) => updateNodeData('config', { ...(selectedNode.data.config as any), assignRole: e.target.value })} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}>
                      <option value="">Select Role...</option>
                      <option value="System Administrator">System Administrator</option>
                      <option value="Manager">Manager</option>
                      <option value="Finance Manager">Finance Manager</option>
                    </select>
                  </div>
                )}

                {selectedNode.data.nodeType === 'condition' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>Field</label>
                      <input type="text" value={(selectedNode.data.config as any)?.field || ''} onChange={(e) => updateNodeData('config', { ...(selectedNode.data.config as any), field: e.target.value })} placeholder="e.g. amount" style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>Operator</label>
                      <select value={(selectedNode.data.config as any)?.operator || '=='} onChange={(e) => updateNodeData('config', { ...(selectedNode.data.config as any), operator: e.target.value })} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}>
                        <option value="==">Equals (==)</option>
                        <option value="!=">Not Equals (!=)</option>
                        <option value=">">Greater Than (&gt;)</option>
                        <option value="<">Less Than (&lt;)</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>Value</label>
                      <input type="text" value={(selectedNode.data.config as any)?.value || ''} onChange={(e) => updateNodeData('config', { ...(selectedNode.data.config as any), value: e.target.value })} placeholder="e.g. 1000" style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                  </>
                )}

                {selectedNode.data.nodeType === 'webhook' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>Endpoint URL</label>
                      <input type="text" value={(selectedNode.data.config as any)?.url || ''} onChange={(e) => updateNodeData('config', { ...(selectedNode.data.config as any), url: e.target.value })} placeholder="https://api.example.com/webhook" style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>Method</label>
                      <select value={(selectedNode.data.config as any)?.method || 'POST'} onChange={(e) => updateNodeData('config', { ...(selectedNode.data.config as any), method: e.target.value })} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}>
                        <option value="POST">POST</option>
                        <option value="GET">GET</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                  </>
                )}
                
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                  <button 
                    onClick={() => {
                      setNodes((nds) => nds.filter(n => n.id !== selectedNode.id));
                      setSelectedNode(null);
                    }}
                    style={{ padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid #fecdd3', background: '#fff1f2', color: '#e11d48', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}
                  >
                    <Trash2 size={14} /> Delete Node
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                <BoxSelect size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ fontSize: '13px' }}>Select a node on the canvas<br/>to edit its properties.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Execution History Modal */}
      {isHistoryModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>Execution History</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Recent runs for this workflow</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {executions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  <Clock size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>No executions yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {executions.map(exec => (
                    <div key={exec.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>{exec.id}</span>
                        <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', fontWeight: '600', background: exec.status === 'COMPLETED' ? '#dcfce7' : '#fee2e2', color: exec.status === 'COMPLETED' ? '#166534' : '#991b1b' }}>
                          {exec.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                        <span>Started: {new Date(exec.startedAt).toLocaleString()}</span>
                        {exec.durationMs && <span>Duration: {exec.durationMs}ms</span>}
                      </div>
                      {exec.error && (
                        <div style={{ marginTop: '12px', padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', color: '#b91c1c' }}>
                          <strong>Error:</strong> {exec.error}
                        </div>
                      )}
                      {exec.logs && (
                        <div style={{ marginTop: '12px', background: '#1e293b', borderRadius: '6px', padding: '12px', maxHeight: '150px', overflowY: 'auto' }}>
                          {exec.logs.map((log: any, i: number) => (
                            <div key={i} style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '4px', fontFamily: 'monospace' }}>
                              <span style={{ color: '#94a3b8' }}>[{new Date(log.time).toLocaleTimeString()}]</span> <span style={{ color: log.level === 'ERROR' ? '#f87171' : '#6ee7b7' }}>[{log.level}]</span> {log.message}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowEditorWrapper() {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
}
