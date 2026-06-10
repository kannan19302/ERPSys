import { type FC } from 'react';
import { Badge, type BadgeProps } from './badge';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusVariantMap: Record<string, BadgeProps['variant']> = {
  ACTIVE: 'success',
  PAID: 'success',
  DELIVERED: 'success',
  APPROVED: 'success',
  COMPLETED: 'success',
  DRAFT: 'default',
  PENDING: 'default',
  INVITED: 'info',
  PROCESSING: 'info',
  IN_PROGRESS: 'info',
  SENT: 'info',
  VIEWED: 'info',
  PARTIALLY_PAID: 'warning',
  OVERDUE: 'warning',
  SUSPENDED: 'warning',
  INACTIVE: 'default',
  CANCELLED: 'danger',
  VOID: 'danger',
  LOCKED: 'danger',
  RETURNED: 'danger',
  FAILED: 'danger',
};

export const StatusBadge: FC<StatusBadgeProps> = ({ status, className }) => {
  const variant = statusVariantMap[status] ?? 'default';
  const label = status.replace(/_/g, ' ');

  return (
    <Badge variant={variant} size="sm" className={className}>
      {label}
    </Badge>
  );
};
