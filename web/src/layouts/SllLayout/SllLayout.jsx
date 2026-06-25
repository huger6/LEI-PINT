import { SLL } from '../../routes/paths';
import AppLayout from '../AppLayout/AppLayout';

// Sidebar navigation items for the Service Line Leader role.
const MENU_ITEMS = [
    { to: SLL.DASHBOARD, icon: 'home', label: 'sidebar.sll.dashboard' },
    { to: SLL.VALIDATIONS, icon: 'paper', label: 'sidebar.sll.validations' },
    { to: SLL.TEAM, icon: 'tabler_users', label: 'sidebar.sll.team' },
    { to: SLL.BADGES, icon: 'badge', label: 'sidebar.sll.badges' },
    { to: SLL.BADGE_HISTORY, icon: 'time', label: 'sidebar.sll.badgeHistory' },
    { to: SLL.STATS, icon: 'evolution', label: 'sidebar.sll.stats' },
    { to: SLL.RANKING, icon: 'ranking', label: 'sidebar.sll.ranking' },
    { to: SLL.ANNOUNCEMENTS, icon: 'megaphone', label: 'sidebar.sll.announcements' },
];

// Renders the app shell with the Service Line Leader menu.
export default function SllLayout() {
    return <AppLayout menuItems={MENU_ITEMS} />;
}
