import { ADMIN } from '../../routes/paths';
import AppLayout from '../AppLayout/AppLayout';

const MENU_ITEMS = [
    { to: ADMIN.DASHBOARD, icon: 'home', label: 'sidebar.admin.dashboard' },
    { to: ADMIN.USERS, icon: 'user', label: 'sidebar.admin.users' },
    { to: ADMIN.STRUCTURE, icon: 'service-line', label: 'sidebar.admin.structure' },
    { to: ADMIN.BADGES, icon: 'badge', label: 'sidebar.admin.badges' },
    { to: ADMIN.APPLICATIONS, icon: 'paper', label: 'sidebar.admin.applications' },
    { to: ADMIN.SLAS, icon: 'time', label: 'sidebar.admin.slas' },
    { to: ADMIN.WARNINGS, icon: 'danger', label: 'sidebar.admin.warnings' },
    { to: ADMIN.NOTIFICATIONS, icon: 'bell', label: 'sidebar.admin.notifications' },
    { to: ADMIN.STATS, icon: 'progress', label: 'sidebar.admin.stats' },
    { to: ADMIN.RGPD, icon: 'privacy', label: 'sidebar.admin.rgpd' },
];

export default function AdminLayout() {
    return <AppLayout menuItems={MENU_ITEMS} />;
}
