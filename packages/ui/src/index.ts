// ─────────────────────────────────────────────────
// @unerp/ui — Design System Entry Point
// ─────────────────────────────────────────────────

// Components
export { Button, type ButtonProps } from './components/button';
export { Badge, type BadgeProps } from './components/badge';
export { Card, type CardProps } from './components/card';
export { Spinner, type SpinnerProps } from './components/spinner';
export { PageHeader, type PageHeaderProps } from './components/page-header';
export { StatusBadge, type StatusBadgeProps } from './components/status-badge';
export { EmptyState, type EmptyStateProps } from './components/empty-state';
export { ChangeHistory, type ChangeHistoryProps } from './components/change-history';
export { DemoBanner, type DemoBannerProps } from './components/demo-banner';
export {
  ProtectedComponent,
  ProtectedField,
  PermissionContext,
  usePermission,
  useFieldAccess,
  type ProtectedComponentProps,
  type ProtectedFieldProps,
} from './components/protected-component';

// Website Builder Blocks
export * from './blocks';
