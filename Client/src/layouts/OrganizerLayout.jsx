import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import OrganizerSidebar from '../components/organizer/Sidebar';
import OrganizerHeader from '../components/organizer/Header';

const OrganizerLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#f3f3f3] relative overflow-hidden">
      {/* Subtle animated background elements */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-[#B9FF66]/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#B9FF66]/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
      
      <OrganizerSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col overflow-hidden relative z-0 w-full min-w-0">
        <OrganizerHeader mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrganizerLayout;
