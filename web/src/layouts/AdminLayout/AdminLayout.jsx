import AppLayout from '../AppLayout/AppLayout';

const MENU_ITEMS = [
    { to: '/', icon: 'home', label: 'sidebar.admin.dashboard' },
    { to: '/users', icon: 'user', label: 'sidebar.admin.users' },
    { to: '/structure', icon: 'service-line', label: 'sidebar.admin.structure' },
    { to: '/levels', icon: 'progress', label: 'sidebar.admin.levels' },
    { to: '/badges', icon: 'badge', label: 'sidebar.admin.badges' },
    { to: '/applications', icon: 'paper', label: 'sidebar.admin.applications' },
    { to: '/slas', icon: 'time', label: 'sidebar.admin.slas' },
    { to: '/warnings', icon: 'danger', label: 'sidebar.admin.warnings' },
    { to: '/notifications', icon: 'bell', label: 'sidebar.admin.notifications' },
    { to: '/stats', icon: 'progress', label: 'sidebar.admin.stats' },
    { to: '/rgpd', icon: 'privacy', label: 'sidebar.admin.rgpd' },
];

export default function AdminLayout() {
    return <AppLayout menuItems={MENU_ITEMS} />;
}
