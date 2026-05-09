import AppLayout from '../AppLayout/AppLayout';

const MENU_ITEMS = [
    { to: '/', icon: 'home', label: 'sidebar.consultant.home', notificationType: 'HOME' },
    { to: '/badges', icon: 'badge', label: 'sidebar.consultant.badges', notificationType: 'BADGES' },
    { to: '/applications', icon: 'paper', label: 'sidebar.consultant.applications', notificationType: 'APPLICATIONS' },
    { to: '/achievements', icon: 'trophy', label: 'sidebar.consultant.achievements', notificationType: 'ACHIEVEMENTS' },
    { to: '/points', icon: 'star-points', label: 'sidebar.consultant.points', notificationType: 'POINTS' },
    { to: '/objectives', icon: 'target', label: 'sidebar.consultant.objectives', notificationType: 'OBJECTIVES' },
    { to: '/evolution', icon: 'evolution', label: 'sidebar.consultant.evolution', notificationType: 'EVOLUTION' },
    { to: '/announcements', icon: 'megaphone', label: 'sidebar.consultant.announcements', notificationType: 'ANNOUNCEMENTS' },
];

export default function ConsultantLayout() {
    return <AppLayout menuItems={MENU_ITEMS} />;
}
