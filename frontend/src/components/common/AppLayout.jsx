import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import EmergencyBanner from '../announcements/EmergencyBanner';
import MobileTabBar from './MobileTabBar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-paper-flat flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <EmergencyBanner />
        <Header />
        <main className="flex-1 pb-20 md:pb-0">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}
