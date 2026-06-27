import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageCircle, Bell, Users, CalendarCheck, Plus, ChevronRight, Sparkles,
} from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import ResponseBadge from '../components/dashboard/ResponseBadge';
import { Card } from '../components/common/Primitives';
import Button from '../components/common/Button';
import PresenceAvatar from '../components/common/PresenceAvatar';
import { useAuthStore } from '../stores/authStore';
import { getSchoolDashboardStats, getAnnouncementFeed, getWeeklyDigest } from '../services/api';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [statsRes, annRes] = await Promise.all([
          getSchoolDashboardStats(user.schoolId).catch(() => ({ data: null })),
          getAnnouncementFeed(user.schoolId).catch(() => ({ data: [] })),
        ]);
        if (!active) return;
        setStats(statsRes.data);
        setAnnouncements(annRes.data.slice(0, 3));
        if (new Date().getDay() === 5) {
          const digestRes = await getWeeklyDigest(user.id).catch(() => ({ data: null }));
          if (active) setDigest(digestRes.data);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    if (user) load();
    return () => { active = false; };
  }, [user]);

  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
            {greetingFor(user)}
          </h1>
          <p className="text-ink-mute mt-1">Here's what's happening across your school today.</p>
        </div>
        <Link to="/chat">
          <Button icon={Plus} className="!bg-gradient-to-r !from-brand !to-grow">
            Start new chat
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={MessageCircle} label="Active chats" value={stats?.activeChats ?? '—'} trend={stats?.activeChatsTrend ?? undefined} color="brand" delay={0} />
        <StatCard icon={Bell} label="Unread messages" value={stats?.unreadMessages ?? '—'} color="warmth" delay={0.05} />
        <StatCard icon={Users} label={isAdmin ? 'Teachers online' : 'Online now'} value={stats?.onlineCount ?? '—'} color="grow" delay={0.1} />
        <StatCard icon={CalendarCheck} label="Pending approvals" value={stats?.pendingApprovals ?? 0} color="brand" delay={0.15} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: recent chats / response status */}
        <div className="lg:col-span-2 space-y-6">
          {isTeacher && (
            <Card>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-display font-bold text-ink">Your response time</h2>
                <ResponseBadge avgResponseMinutes={stats?.avgResponseMinutes ?? null} />
              </div>
              <p className="text-sm text-ink-mute">
                Parents see this on your profile. Fast, transparent replies build trust.
              </p>
            </Card>
          )}

          <Card padding="p-0">
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="font-display font-bold text-ink">Recent conversations</h2>
              <Link to="/chat" className="text-sm font-semibold text-brand flex items-center gap-0.5 hover:underline">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            {loading ? (
              <div className="px-5 pb-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-card skeleton-shimmer animate-shimmer" />
                ))}
              </div>
            ) : (stats?.recentChats || []).length === 0 ? (
              <p className="text-sm text-ink-faint text-center py-8">No conversations yet — start one from Messages.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.recentChats.map((chat) => (
                  <Link
                    key={chat.id}
                    to="/chat"
                    className="flex items-center gap-3 px-5 py-3 hover:bg-paper-flat transition-colors"
                  >
                    <PresenceAvatar name={chat.name} userId={chat.id} status={chat.status} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink text-sm truncate">{chat.name}</p>
                      <p className="text-xs text-ink-faint truncate">{chat.lastMessage}</p>
                    </div>
                    {chat.unread > 0 && (
                      <span className="bg-danger text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {chat.unread}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {digest && (
            <Card className="border-warmth-200 bg-warmth-50">
              <div className="flex items-start gap-3">
                <Sparkles size={20} className="text-warmth-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display font-bold text-ink mb-1">Your week in review</h3>
                  <p className="text-sm text-ink-soft">{digest.summary}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right: announcements */}
        <div className="space-y-6">
          <Card padding="p-0">
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="font-display font-bold text-ink">Announcements</h2>
              <Link to="/announcements" className="text-xs font-semibold text-brand hover:underline">
                See all
              </Link>
            </div>
            <div className="px-5 pb-5 space-y-3">
              {announcements.length === 0 && (
                <p className="text-sm text-ink-faint py-4 text-center">No announcements yet.</p>
              )}
              {announcements.map((a) => (
                <div key={a.id} className="border-l-2 pl-3 py-1" style={{ borderColor: typeColor(a.type) }}>
                  <p className="text-sm font-semibold text-ink line-clamp-1">{a.title}</p>
                  <p className="text-xs text-ink-faint line-clamp-2">{a.content}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function greetingFor(user) {
  const hour = new Date().getHours();
  const time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const title = user?.role === 'TEACHER' ? 'Mr./Ms.' : '';
  const name = user?.fullName?.split(' ')[0] || '';
  return `${time}, ${name}! 👋`;
}

function typeColor(type) {
  return { INFO: '#2563EB', IMPORTANT: '#F59E0B', URGENT: '#EF4444', EVENT: '#10B981' }[type] || '#2563EB';
}
