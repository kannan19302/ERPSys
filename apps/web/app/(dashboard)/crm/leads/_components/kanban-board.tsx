'use client';

import React from 'react';
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@unerp/ui';
import { Building, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
    status: string;
    score: number;
    source?: { name: string } | null;
    email: string | null;
}

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED'];
const STATUS_COLORS: Record<string, string> = {
    NEW: '#3b82f6', CONTACTED: '#f59e0b', QUALIFIED: '#10b981',
    DISQUALIFIED: '#ef4444', CONVERTED: '#8b5cf6'
};

function ScoreChip({ score }: { score: number }) {
    const color = score >= 80 ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-text-tertiary)';
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-sunken)', color, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>
            <TrendingUp size={10} /> {score}
        </span>
    );
}

function KanbanCard({ lead }: { lead: Lead }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: lead.id,
        data: { lead },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        zIndex: isDragging ? 1000 : 1,
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <Card padding="sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                        <Link href={`/crm/leads/${lead.id}`} style={{ textDecoration: 'none', color: 'inherit' }} onPointerDown={e => e.stopPropagation()}>
                            {lead.firstName} {lead.lastName}
                        </Link>
                    </span>
                    <ScoreChip score={lead.score} />
                </div>
                {lead.company && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        <Building size={12} /> {lead.company}
                    </div>
                )}
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    <span style={{ fontSize: '10px', background: 'var(--color-bg-sunken)', padding: '1px 6px', borderRadius: 'var(--radius-full)' }}>Score: {lead.score}</span>
                    {lead.source && <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{lead.source.name}</span>}
                </div>
            </Card>
        </div>
    );
}

function KanbanColumn({ status, leads }: { status: string, leads: Lead[] }) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    return (
        <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: STATUS_COLORS[status] || '#6b7280' }} />
                <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{status}</span>
                <span style={{ marginLeft: 'auto', background: 'var(--color-bg-sunken)', padding: '1px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)' }}>{leads.length}</span>
            </div>
            
            <div 
                ref={setNodeRef} 
                style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--space-2)', 
                    minHeight: '200px', 
                    padding: 'var(--space-2)', 
                    background: isOver ? 'var(--color-bg-sunken)' : 'transparent',
                    borderRadius: 'var(--radius-md)',
                    transition: 'background 0.2s'
                }}
            >
                {leads.map(lead => <KanbanCard key={lead.id} lead={lead} />)}
            </div>
        </div>
    );
}

export function KanbanBoard({ leads, onStatusChange }: { leads: Lead[], onStatusChange: (leadId: string, newStatus: string) => void }) {
    const groupedLeads = LEAD_STATUSES.reduce((acc, status) => {
        acc[status] = leads.filter(l => l.status === status);
        return acc;
    }, {} as Record<string, Lead[]>);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id && over.id) {
            const leadId = String(active.id);
            const newStatus = String(over.id);
            
            const lead = leads.find(l => l.id === leadId);
            if (lead && lead.status !== newStatus) {
                onStatusChange(leadId, newStatus);
            }
        }
    };

    return (
        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', minHeight: '60vh', paddingBottom: 'var(--space-4)' }}>
                {LEAD_STATUSES.map(status => (
                    <KanbanColumn key={status} status={status} leads={groupedLeads[status] || []} />
                ))}
            </div>
        </DndContext>
    );
}
