import { Outlet } from 'react-router-dom';
import OrganizerSidebar from '../components/organizer/Sidebar';
import OrganizerHeader from '../components/organizer/Header';

const OrganizerLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <OrganizerSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <OrganizerHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default OrganizerLayout;
