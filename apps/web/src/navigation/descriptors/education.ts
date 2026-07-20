import { registerModule } from '@unerp/shared/module-registry';

registerModule({
  slug: 'education',
  title: 'Education',
  icon: 'GraduationCap',
  routeSegment: 'education',
  dashboardRoute: '/education',
  settingsRoute: undefined,
  nav: [
    { label: 'Dashboard', href: '/education', icon: 'Home' },
    {
      label: 'Academic',
      isHeader: true,
      items: [
        { label: 'Student Registry', href: '/education/students', icon: 'Users' },
        { label: 'Course Catalog', href: '/education/courses', icon: 'BookOpen' },
        { label: 'Timetable', href: '/education/timetable', icon: 'Calendar' },
        { label: 'Grade Book', href: '/education/grades', icon: 'Award' },
        { label: 'Attendance', href: '/education/attendance', icon: 'ClipboardCheck' },
      ],
    },
    {
      label: 'Administration',
      isHeader: true,
      items: [
        { label: 'Fee Management', href: '/education/fees', icon: 'DollarSign' },
        { label: 'Fee Payments', href: '/education/fees/pay', icon: 'CreditCard' },
        { label: 'Library', href: '/education/library', icon: 'BookOpen' },
      ],
    },
    {
      label: 'Reporting',
      isHeader: true,
      items: [
        { label: 'Reports & Analytics', href: '/education/reports', icon: 'BarChart3' },
      ],
    },
  ],
});
