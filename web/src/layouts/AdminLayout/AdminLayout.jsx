import { ADMIN } from '../../routes/paths';
import AppLayout from '../AppLayout/AppLayout';

// Sidebar navigation items for the Administrator role.
const MENU_ITEMS = [
    { to: ADMIN.DASHBOARD, icon: 'home', label: 'sidebar.admin.dashboard' },
    { to: ADMIN.USERS, icon: 'user', label: 'sidebar.admin.users' },
    { to: ADMIN.STRUCTURE, icon: 'structure', label: 'sidebar.admin.structure' },
    { to: ADMIN.BADGES, icon: 'badge', label: 'sidebar.admin.badges' },
    { to: ADMIN.APPLICATIONS, icon: 'paper', label: 'sidebar.admin.applications' },
    { to: ADMIN.REWARDS, icon: 'badge-premium', label: 'sidebar.admin.rewards' },
    { to: ADMIN.SLAS, icon: 'time', label: 'sidebar.admin.slas' },
    { to: ADMIN.NOTIFICATIONS, icon: 'bell', label: 'sidebar.admin.notifications' },
    { to: ADMIN.INTEGRATIONS, icon: 'link', label: 'sidebar.admin.integrations' },
    { to: ADMIN.ANNOUNCEMENTS, icon: 'megaphone', label: 'sidebar.admin.announcements' },
    { to: ADMIN.STATS, icon: 'progress', label: 'sidebar.admin.stats' },
    { to: ADMIN.RGPD, icon: 'privacy', label: 'sidebar.admin.rgpd' },
];

// Renders the app shell with the Administrator menu.
export default function AdminLayout() {
    return <AppLayout menuItems={MENU_ITEMS} />;
}
