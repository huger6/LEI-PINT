import { TM } from '../../routes/paths';
import AppLayout from '../AppLayout/AppLayout';

// Sidebar navigation items for the Talent Manager role.
const MENU_ITEMS = [
    { to: TM.DASHBOARD, icon: 'home', label: 'sidebar.tm.dashboard' },
    { to: TM.VALIDATIONS, icon: 'paper', label: 'sidebar.tm.validations' },
    { to: TM.CONSULTANTS, icon: 'tabler_users', label: 'sidebar.tm.consultants' },
    { to: TM.BADGES, icon: 'badge', label: 'sidebar.tm.badges' },
    { to: TM.STATS, icon: 'evolution', label: 'sidebar.tm.stats' },
    { to: TM.RANKING, icon: 'ranking', label: 'sidebar.tm.ranking' },
    { to: TM.ANNOUNCEMENTS, icon: 'megaphone', label: 'sidebar.tm.announcements' },
];

// Renders the app shell with the Talent Manager menu.
export default function TmLayout() {
    return <AppLayout menuItems={MENU_ITEMS} />;
}
