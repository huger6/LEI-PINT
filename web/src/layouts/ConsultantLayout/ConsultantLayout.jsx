import { CONSULTANT } from '../../routes/paths';
import AppLayout from '../AppLayout/AppLayout';

const MENU_ITEMS = [
    { to: CONSULTANT.HOME, icon: 'home', label: 'sidebar.consultant.home', notificationType: 'HOME' },
    { to: CONSULTANT.CATALOG, icon: 'badge', label: 'sidebar.consultant.badges', notificationType: 'BADGES' },
    { to: CONSULTANT.APPLICATIONS, icon: 'paper', label: 'sidebar.consultant.applications', notificationType: 'APPLICATIONS' },
    { to: CONSULTANT.ACHIEVEMENTS, icon: 'trophy', label: 'sidebar.consultant.achievements', notificationType: 'ACHIEVEMENTS' },
    { to: CONSULTANT.POINTS, icon: 'star-points', label: 'sidebar.consultant.points', notificationType: 'POINTS' },
    { to: CONSULTANT.OBJECTIVES, icon: 'target', label: 'sidebar.consultant.objectives', notificationType: 'OBJECTIVES' },
    { to: CONSULTANT.EVOLUTION, icon: 'evolution', label: 'sidebar.consultant.evolution', notificationType: 'EVOLUTION' },
    { to: CONSULTANT.RANKING, icon: 'ranking', label: 'sidebar.consultant.ranking' },
    { to: CONSULTANT.STORE, icon: 'star-points', label: 'sidebar.consultant.store' },
    { to: CONSULTANT.ANNOUNCEMENTS, icon: 'megaphone', label: 'sidebar.consultant.announcements', notificationType: 'ANNOUNCEMENTS' },
];

export default function ConsultantLayout() {
    return <AppLayout menuItems={MENU_ITEMS} />;
}
