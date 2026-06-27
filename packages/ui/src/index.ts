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

// Sprint 1 — UX foundation primitives
export { Skeleton, SkeletonText, type SkeletonProps, type SkeletonTextProps } from './components/skeleton';
export { ToastProvider, useToast, type ToastOptions, type ToastVariant } from './components/toast';
export { Modal, ConfirmDialog, type ModalProps, type ConfirmDialogProps } from './components/modal';
export { FormField, Input, Textarea, Select, TextField, type FormFieldProps, type InputProps, type TextareaProps, type SelectProps } from './components/form';
export { DataTable, type Column, type DataTableProps } from './components/table';
export { Tabs, Tooltip, Pagination, Drawer, type TabsProps, type TabItem, type TooltipProps, type PaginationProps, type DrawerProps } from './components/navigation';

// Sprint 5 — Forms & data-entry UX
export { Stepper, FormSection, AutosaveIndicator, type StepperProps, type StepperStep, type FormSectionProps, type AutosaveIndicatorProps, type AutosaveStatus } from './components/stepper';

// Sprint 6 — Dashboards & data visualization
export { KPICard, MiniBarChart, MiniDonutChart, Sparkline, type KPICardProps, type MiniBarChartProps, type MiniDonutChartProps, type SparklineProps, type BarChartData, type DonutSegment } from './components/charts';

// Sprint 7 — Advanced Dashboard Infrastructure
export { DashboardChart, type DashboardChartProps, type DashboardChartConfig, type ChartSeries } from './components/dashboard-chart';
export { DashboardKPICard, type DashboardKPICardProps } from './components/dashboard-kpi-card';
export { ViewSwitcher, type ViewSwitcherProps, type ViewMode } from './components/view-switcher';
export { ChartTypePicker, type ChartTypePickerProps, type ChartType, type ChartTypeOption } from './components/chart-type-picker';
export { KanbanBoard, type KanbanBoardProps, type KanbanColumn, type KanbanItem } from './components/kanban-board';
export { DrillDownModal, type DrillDownModalProps, type DrillDownColumn } from './components/drill-down-modal';

// Website Builder Blocks
export * from './blocks';
