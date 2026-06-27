import { useUser } from '../../hooks/userContext';
import { SLL, SHARED } from '../../routes/paths';
import AppLayout from '../AppLayout/AppLayout';

// Static menu entries for the Service Line Leader role. The "My Service Line"
// entry is appended dynamically because it points at the leader's own SL detail.
const BASE_MENU_ITEMS = [
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
    const { user } = useUser();
    const slSlug = user?.serviceLine?.slug;

    const menuItems = [...BASE_MENU_ITEMS];
    if (slSlug) {
        // Read-only view of the leader's own Service Line (same page consultants
        // see — management actions are hidden for non-admins).
        menuItems.splice(3, 0, {
            to: SHARED.STRUCTURE_SL_DETAIL.replace(':slug', slSlug),
            icon: 'service-line',
            label: 'sidebar.sll.myServiceLine',
        });
    }
    menuItems.push({ to: SLL.GAMIFICATION, icon: 'star-points', label: 'sidebar.sll.gamification' });

    return <AppLayout menuItems={menuItems} />;
}
