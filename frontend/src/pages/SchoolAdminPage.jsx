import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users, School, Settings as SettingsIcon, Mail, Trash2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Input } from '../components/common/Primitives';
import Button from '../components/common/Button';
import PresenceAvatar from '../components/common/PresenceAvatar';
import StatCard from '../components/dashboard/StatCard';
import { useAuthStore } from '../stores/authStore';
import { getSchool, getSchoolDashboardStats, updateSchoolSettings, inviteStaff } from '../services/api';

export default function SchoolAdminPage() {
  const user = useAuthStore((s) => s.user);
  const [school, setSchool] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!user?.schoolId) return;
    Promise.all([getSchool(user.schoolId), getSchoolDashboardStats(user.schoolId)])
      .then(([schoolRes, statsRes]) => {
        setSchool(schoolRes.data);
        setStats(statsRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const inviteLink = `${window.location.origin}/register?school=${user?.schoolId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied');
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { data } = await inviteStaff(user.schoolId, inviteEmail.trim());
      toast.success(data.message);
      setInviteEmail('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send invitation — check your email service setup');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-card skeleton-shimmer animate-shimmer" />)}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-12 h-12 rounded-card bg-brand-50 flex items-center justify-center">
          <School size={22} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">{school?.name || 'Your school'}</h1>
          <p className="text-ink-mute">{school?.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Teachers" value={stats?.teacherCount ?? 0} color="brand" />
        <StatCard icon={Users} label="Parents" value={stats?.parentCount ?? 0} color="grow" />
        <StatCard icon={Users} label="Students" value={stats?.studentCount ?? 0} color="warmth" />
        <StatCard icon={Mail} label="Messages this week" value={stats?.weeklyMessages ?? 0} color="brand" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="p-0">
            <div className="p-5 pb-3 flex items-center justify-between">
              <h2 className="font-display font-bold text-ink">Teachers</h2>
              <span className="text-xs text-ink-faint">{school?.teachers?.length || 0} total</span>
            </div>
            <div className="divide-y divide-gray-100">
              {(school?.teachers || []).map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <PresenceAvatar name={t.fullName} userId={t.id} status={t.status} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink text-sm truncate">{t.fullName}</p>
                    <p className="text-xs text-ink-faint truncate">{t.bio || t.email}</p>
                  </div>
                  <button className="text-ink-faint hover:text-danger flex-shrink-0" aria-label="Remove teacher">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {(!school?.teachers || school.teachers.length === 0) && (
                <p className="text-sm text-ink-faint text-center py-8">No teachers added yet. Invite some below.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-display font-bold text-ink mb-1 flex items-center gap-2"><UserPlus size={17} /> Invite staff</h3>
            <p className="text-xs text-ink-faint mb-3">Share this link, or invite by email below.</p>
            <div className="flex gap-2 mb-3">
              <Input value={inviteLink} readOnly className="text-xs" />
              <Button size="sm" variant="outline" icon={Copy} onClick={handleCopyLink} />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="teacher@school.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="text-sm"
              />
              <Button size="sm" onClick={handleInvite} loading={inviting}>Send</Button>
            </div>
          </Card>

          <Card>
            <h3 className="font-display font-bold text-ink mb-3 flex items-center gap-2"><SettingsIcon size={17} /> School settings</h3>
            <p className="text-xs text-ink-faint">Logo, contact details, and academic year settings can be configured from here as your school grows.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
