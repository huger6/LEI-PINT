import { TM } from '../../routes/paths';
import AppLayout from '../AppLayout/AppLayout';

const MENU_ITEMS = [
    { to: TM.DASHBOARD, icon: 'home', label: 'sidebar.tm.dashboard' },
    { to: TM.VALIDATIONS, icon: 'check', label: 'sidebar.tm.validations' },
    { to: TM.CONSULTANTS, icon: 'user', label: 'sidebar.tm.consultants' },
    { to: TM.BADGES, icon: 'badge', label: 'sidebar.tm.badges' },
    { to: TM.STATS, icon: 'progress', label: 'sidebar.tm.stats' },
    { to: TM.RANKING, icon: 'trophy', label: 'sidebar.tm.ranking' },
    { to: TM.ANNOUNCEMENTS, icon: 'megaphone', label: 'sidebar.tm.announcements' },
];

export default function TmLayout() {
    return <AppLayout menuItems={MENU_ITEMS} />;
}
