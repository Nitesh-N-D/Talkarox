import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, MessageCircle, CalendarClock, Megaphone,
  Trophy, Settings, ShieldCheck, X,
} from 'lucide-react';
import clsx from 'clsx';
import Logo from '../common/Logo';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
  { to: '/chat', icon: MessageCircle, label: 'Messages', roles: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
  { to: '/appointments', icon: CalendarClock, label: 'Appointments', roles: ['ADMIN', 'TEACHER', 'PARENT'] },
  { to: '/announcements', icon: Megaphone, label: 'Announcements', roles: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard', roles: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
  { to: '/school', icon: ShieldCheck, label: 'School Admin', roles: ['ADMIN'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { sidebarOpen, closeSidebar } = useUIStore();
  const role = user?.role || 'PARENT';

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink/30 z-40 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-50 transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100">
          <Logo size="sm" />
          <button onClick={closeSidebar} className="md:hidden text-ink-faint" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-mute hover:bg-paper-flat hover:text-ink'
                )
              }
            >
              <item.icon size={18} strokeWidth={2.1} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-br from-brand-50 to-grow-50 rounded-card p-3.5">
            <p className="text-xs font-semibold text-ink mb-1">Talkarox is free</p>
            <p className="text-xs text-ink-faint">Built for schools, zero cost, always.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
