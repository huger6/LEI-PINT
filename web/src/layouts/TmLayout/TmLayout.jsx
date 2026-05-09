import AppLayout from '../AppLayout/AppLayout';

const MENU_ITEMS = [
    { to: '/', icon: 'home', label: 'sidebar.tm.dashboard' },
    { to: '/validations', icon: 'check', label: 'sidebar.tm.validations' },
    { to: '/consultants', icon: 'user', label: 'sidebar.tm.consultants' },
    { to: '/badges', icon: 'badge', label: 'sidebar.tm.badges' },
    { to: '/stats', icon: 'progress', label: 'sidebar.tm.stats' },
    { to: '/ranking', icon: 'trophy', label: 'sidebar.tm.ranking' },
    { to: '/announcements', icon: 'megaphone', label: 'sidebar.tm.announcements' },
];

export default function TmLayout() {
    return <AppLayout menuItems={MENU_ITEMS} />;
}
