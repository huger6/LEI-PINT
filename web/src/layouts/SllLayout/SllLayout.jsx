import { SLL } from '../../routes/paths';
import AppLayout from '../AppLayout/AppLayout';

const MENU_ITEMS = [
    { to: SLL.DASHBOARD, icon: 'home', label: 'sidebar.sll.dashboard' },
    { to: SLL.VALIDATIONS, icon: 'check', label: 'sidebar.sll.validations' },
    { to: SLL.TEAM, icon: 'user', label: 'sidebar.sll.team' },
    { to: SLL.BADGES, icon: 'badge', label: 'sidebar.sll.badges' },
    { to: SLL.BADGE_HISTORY, icon: 'time', label: 'sidebar.sll.badgeHistory' },
    { to: SLL.STATS, icon: 'progress', label: 'sidebar.sll.stats' },
    { to: SLL.RANKING, icon: 'trophy', label: 'sidebar.sll.ranking' },
    { to: SLL.ANNOUNCEMENTS, icon: 'megaphone', label: 'sidebar.sll.announcements' },
];

export default function SllLayout() {
    return <AppLayout menuItems={MENU_ITEMS} />;
}
