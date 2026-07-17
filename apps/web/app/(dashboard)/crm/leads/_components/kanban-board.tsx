'use client';

import React from 'react';
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@unerp/ui';
import { Building, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import styles from './kanban-board.module.css';

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
    NEW: 'var(--color-info)', CONTACTED: 'var(--color-warning)', QUALIFIED: 'var(--color-success)',
    DISQUALIFIED: 'var(--color-danger)', CONVERTED: 'var(--color-primary)'
};

function ScoreChip({ score }: { score: number }) {
    const color = score >= 80 ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-text-tertiary)';
    return (
        <span className={styles.scoreChip} style={{ color }}>
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
                <div className={styles.cardHeader}>
                    <span className={styles.leadName}>
                        <Link href={`/crm/leads/${lead.id}`} className={styles.leadLink} onPointerDown={e => e.stopPropagation()}>
                            {lead.firstName} {lead.lastName}
                        </Link>
                    </span>
                    <ScoreChip score={lead.score} />
                </div>
                {lead.company && (
                    <div className={styles.company}>
                        <Building size={12} /> {lead.company}
                    </div>
                )}
                <div className={styles.cardMeta}>
                    <span className={styles.scoreLabel}>Score: {lead.score}</span>
                    {lead.source && <span className="ui-text-micro">{lead.source.name}</span>}
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
        <div className={styles.column}>
            <div className={styles.columnHeader}>
                <div className={styles.statusDot} style={{ background: STATUS_COLORS[status] || 'var(--color-text-tertiary)' }} />
                <span className="ui-heading-sm">{status}</span>
                <span className={styles.count}>{leads.length}</span>
            </div>
            
            <div 
                ref={setNodeRef} 
                className={styles.dropZone}
                style={{ background: isOver ? 'var(--color-bg-sunken)' : 'transparent' }}
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
            <div className={styles.board}>
                {LEAD_STATUSES.map(status => (
                    <KanbanColumn key={status} status={status} leads={groupedLeads[status] || []} />
                ))}
            </div>
        </DndContext>
    );
}
