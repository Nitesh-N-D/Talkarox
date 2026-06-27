import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageCircle, CalendarClock, Megaphone, Menu } from 'lucide-react';
import clsx from 'clsx';
import { useUIStore } from '../../stores/uiStore';

const TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/appointments', icon: CalendarClock, label: 'Schedule' },
  { to: '/announcements', icon: Megaphone, label: 'News' },
];

export default function MobileTabBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around h-16 z-30 pb-safe">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-medium transition-colors',
              isActive ? 'text-brand' : 'text-ink-faint'
            )
          }
        >
          <tab.icon size={20} strokeWidth={2.1} />
          {tab.label}
        </NavLink>
      ))}
      <button
        onClick={toggleSidebar}
        className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-medium text-ink-faint"
      >
        <Menu size={20} strokeWidth={2.1} />
        More
      </button>
    </nav>
  );
}
