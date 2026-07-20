import { registerModule } from '@unerp/shared/module-registry';

registerModule({
  slug: 'hr',
  title: 'Human Resources',
  icon: 'Users',
  routeSegment: 'hr',
  dashboardRoute: '/hr',
  settingsRoute: undefined,
  nav: [
    { label: 'Employee Directory', href: '/hr', icon: 'Users' },
    { label: 'Self-Service Portal', href: '/hr/advanced/self-service', icon: 'UserIcon' },
    {
      label: 'Talent Management',
      isHeader: true,
      items: [
        { label: 'Recruitment', href: '/hr/advanced/recruitment', icon: 'Briefcase' },
        { label: 'Onboarding Checklists', href: '/hr/advanced/onboarding', icon: 'UserPlus' },
        { label: 'Offboarding Checklists', href: '/hr/advanced/offboarding', icon: 'UserMinus' },
        { label: 'Goals & OKRs', href: '/hr/advanced/goals', icon: 'Target' },
        { label: 'Skills Matrix', href: '/hr/advanced/skills', icon: 'Star' },
        { label: 'Performance Appraisals', href: '/hr/advanced/appraisals', icon: 'Award' },
        { label: '360° Feedback', href: '/hr/advanced/feedback', icon: 'MessageSquare' },
        { label: 'Succession Plan', href: '/hr/advanced/succession', icon: 'TrendingUp' },
      ],
    },
    {
      label: 'Operations & Service',
      isHeader: true,
      items: [
        { label: 'Attendance Record', href: '/hr/advanced/attendance', icon: 'Clock' },
        { label: 'Shift Scheduling', href: '/hr/advanced/shifts', icon: 'CalendarDays' },
        { label: 'Documents Manager', href: '/hr/advanced/documents', icon: 'FileText' },
        { label: 'Trainings & Certs', href: '/hr/advanced/trainings', icon: 'GraduationCap' },
        { label: 'Operations & Service Hub', href: '/hr/advanced/operations-service', icon: 'Monitor' },
      ],
    },
    {
      label: 'Compensation & BI',
      isHeader: true,
      items: [
        { label: 'Payroll & Salaries', href: '/hr/advanced/payroll', icon: 'DollarSign' },
        { label: 'Leave Management', href: '/hr/advanced/leaves', icon: 'Coffee' },
        { label: 'Benefits Admin', href: '/hr/advanced/benefits', icon: 'CreditCard' },
        { label: 'Position Control', href: '/hr/advanced/positions', icon: 'ClipboardCheck' },
        { label: 'Workforce Analytics', href: '/hr/advanced/analytics', icon: 'BarChart3' },
      ],
    },
  ],
});
