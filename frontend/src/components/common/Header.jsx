import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import PresenceAvatar from './PresenceAvatar';

export default function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1">
        <button onClick={toggleSidebar} className="md:hidden text-ink-mute" aria-label="Open menu">
          <Menu size={22} />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm text-ink-mute">
            {greeting()}, <span className="font-semibold text-ink">{user?.fullName?.split(' ')[0] || 'there'}</span> 👋
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          className="hidden sm:flex items-center gap-2 bg-paper-flat rounded-card px-3 py-2 text-sm text-ink-faint hover:text-ink-mute transition-colors w-56"
          onClick={() => navigate('/chat?search=true')}
        >
          <Search size={16} />
          Search messages…
        </button>

        <button className="relative p-2 text-ink-mute hover:text-ink rounded-card hover:bg-paper-flat transition-colors" aria-label="Notifications">
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((m) => !m)}
            className="flex items-center gap-2 hover:bg-paper-flat rounded-card px-1.5 py-1 transition-colors"
          >
            <PresenceAvatar name={user?.fullName} userId={user?.id} status={user?.status || 'ONLINE'} size="sm" />
            <ChevronDown size={15} className="text-ink-faint hidden sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 w-52 bg-white border border-gray-100 rounded-card shadow-lifted py-1.5 animate-popIn">
              <div className="px-3.5 py-2 border-b border-gray-100 mb-1">
                <p className="text-sm font-semibold text-ink truncate">{user?.fullName}</p>
                <p className="text-xs text-ink-faint truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); navigate('/settings'); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink-mute hover:bg-paper-flat"
              >
                <Settings size={16} /> Settings
              </button>
              <button
                onClick={async () => { await logout(); navigate('/login'); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-danger hover:bg-danger-50"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
