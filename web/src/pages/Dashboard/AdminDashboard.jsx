import WelcomeCard from '../../components/WelcomeCard/WelcomeCard';
import Pagination from '../../components/Pagination/Pagination';

export default function AdminDashboard() {
    return (<div>
        <WelcomeCard />
        <Pagination currentPage={1} totalPages={5} totalItems={50} onPageChange={(page) => console.log(page)} />
    </div>);
}
