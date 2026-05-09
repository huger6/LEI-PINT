import AppLayout from '../AppLayout/AppLayout';

const MENU_ITEMS = [
    { to: '/', icon: 'home', label: 'sidebar.sll.dashboard' },
    { to: '/validations', icon: 'check', label: 'sidebar.sll.validations' },
    { to: '/team', icon: 'user', label: 'sidebar.sll.team' },
    { to: '/badges', icon: 'badge', label: 'sidebar.sll.badges' },
    { to: '/badge-history', icon: 'time', label: 'sidebar.sll.badgeHistory' },
    { to: '/stats', icon: 'progress', label: 'sidebar.sll.stats' },
    { to: '/ranking', icon: 'trophy', label: 'sidebar.sll.ranking' },
    { to: '/announcements', icon: 'megaphone', label: 'sidebar.sll.announcements' },
];

export default function SllLayout() {
    return <AppLayout menuItems={MENU_ITEMS} />;
}
