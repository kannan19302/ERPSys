'use client';

import { PageHeader } from '@unerp/ui';
import { ListView, RouteGuard } from '@unerp/framework';
import { activityFeedResource } from '@/modules/admin';

export default function ActivityFeedPage() {
  return (
    <RouteGuard permission="admin.setting.read">
      <div className="ui-card">
        <PageHeader title="Activity Feed" description="Review tenant-wide record changes and administrative activity." breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Settings', href: '/settings' }, { label: 'Activity Feed' }]} />
        <ListView resource={activityFeedResource} />
      </div>
    </RouteGuard>
  );
}
