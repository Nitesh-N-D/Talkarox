import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Bell, Globe, Clock, Shield, LogOut, Trash2, Camera, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Input, Select } from '../components/common/Primitives';
import Button from '../components/common/Button';
import Avatar from '../components/illustrations/Avatar';
import { useAuthStore } from '../stores/authStore';
import { updateProfile, setOfficeHours, uploadAvatar } from '../services/api';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ta', label: 'Tamil' },
  { value: 'hi', label: 'Hindi' },
  { value: 'te', label: 'Telugu' },
  { value: 'kn', label: 'Kannada' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'es', label: 'Spanish' },
];

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'language', label: 'Language', icon: Globe },
  { key: 'hours', label: 'Office hours', icon: Clock, teacherOnly: true },
  { key: 'account', label: 'Account', icon: Shield },
];

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [activeTab, setActiveTab] = useState('profile');

  const visibleTabs = TABS.filter((t) => !t.teacherOnly || user?.role === 'TEACHER');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mb-1">Settings</h1>
      <p className="text-ink-mute mb-7">Manage your profile, notifications, and preferences.</p>

      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-card text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key ? 'bg-brand-50 text-brand-700' : 'text-ink-mute hover:bg-paper-flat'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </nav>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === 'profile' && <ProfileTab user={user} setUser={setUser} />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'language' && <LanguageTab user={user} setUser={setUser} />}
          {activeTab === 'hours' && <OfficeHoursTab user={user} />}
          {activeTab === 'account' && <AccountTab logout={logout} />}
        </motion.div>
      </div>
    </div>
  );
}

function ProfileTab({ user, setUser }) {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await updateProfile({ fullName, bio });
      setUser(data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await uploadAvatar(formData);
      setUser({ ...user, avatarUrl: data.avatarUrl });
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not upload photo — file storage may not be configured yet');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  return (
    <Card className="max-w-lg">
      <div className="flex items-center gap-4 mb-5">
        <div className="relative">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={fullName} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <Avatar name={fullName} id={user?.id} size={64} />
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center shadow-card hover:bg-brand-700 disabled:opacity-60"
            aria-label="Change photo"
          >
            {uploadingAvatar ? <Loader2 size={13} className="animate-spin" /> : <Camera size={14} />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
        </div>
        <div>
          <p className="font-semibold text-ink">{user?.email}</p>
          <p className="text-xs text-ink-faint capitalize">{user?.role?.toLowerCase()}</p>
        </div>
      </div>
      <div className="space-y-4">
        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Mathematics, Grade 8–9" />
        <Button onClick={handleSave} loading={saving}>Save changes</Button>
      </div>
    </Card>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    newMessages: true,
    appointmentReminders: true,
    weeklyDigest: true,
    announcements: true,
    emailNotifications: false,
  });

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <Card className="max-w-lg space-y-1">
      {Object.entries({
        newMessages: 'New messages',
        appointmentReminders: 'Appointment reminders',
        weeklyDigest: 'Weekly digest summary',
        announcements: 'School announcements',
        emailNotifications: 'Also send via email',
      }).map(([key, label]) => (
        <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
          <span className="text-sm text-ink-soft">{label}</span>
          <button
            onClick={() => toggle(key)}
            className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${prefs[key] ? 'bg-brand' : 'bg-gray-300'}`}
            aria-pressed={prefs[key]}
            aria-label={label}
          >
            <motion.span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
              animate={{ x: prefs[key] ? 16 : 0 }}
              transition={{ duration: 0.15 }}
            />
          </button>
        </div>
      ))}
    </Card>
  );
}

function LanguageTab({ user, setUser }) {
  const [language, setLanguage] = useState(user?.preferredLanguage || 'en');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await updateProfile({ preferredLanguage: language });
      setUser(data);
      toast.success('Language preference saved');
    } catch {
      toast.error('Could not save preference');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-md space-y-4">
      <p className="text-sm text-ink-mute">Messages you choose to translate will be shown in this language.</p>
      <Select label="Preferred language" value={language} onChange={(e) => setLanguage(e.target.value)} options={LANGUAGES} />
      <Button onClick={handleSave} loading={saving}>Save preference</Button>
    </Card>
  );
}

function OfficeHoursTab({ user }) {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [slots, setSlots] = useState(user?.officeHours?.length ? user.officeHours : [{ dayOfWeek: 1, startTime: '16:00', endTime: '18:00', availableFor: 'PARENTS' }]);
  const [saving, setSaving] = useState(false);

  const addSlot = () => setSlots((s) => [...s, { dayOfWeek: 1, startTime: '16:00', endTime: '18:00', availableFor: 'PARENTS' }]);
  const removeSlot = (idx) => setSlots((s) => s.filter((_, i) => i !== idx));
  const updateSlot = (idx, key, value) => setSlots((s) => s.map((slot, i) => (i === idx ? { ...slot, [key]: value } : slot)));

  const handleSave = async () => {
    setSaving(true);
    try {
      await setOfficeHours(user.id, slots);
      toast.success('Office hours updated');
    } catch {
      toast.error('Could not save office hours');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-lg space-y-3">
      <p className="text-sm text-ink-mute mb-2">Parents and students will only see you as available during these windows.</p>
      {slots.map((slot, idx) => (
        <div key={idx} className="flex items-center gap-2 bg-paper-flat p-2.5 rounded-card">
          <Select options={DAYS.map((d, i) => ({ value: i, label: d }))} value={slot.dayOfWeek} onChange={(e) => updateSlot(idx, 'dayOfWeek', Number(e.target.value))} className="!py-2 text-xs w-28" />
          <input type="time" value={slot.startTime} onChange={(e) => updateSlot(idx, 'startTime', e.target.value)} className="rounded-input border border-gray-300 px-2 py-2 text-xs flex-1" />
          <span className="text-ink-faint text-xs">–</span>
          <input type="time" value={slot.endTime} onChange={(e) => updateSlot(idx, 'endTime', e.target.value)} className="rounded-input border border-gray-300 px-2 py-2 text-xs flex-1" />
          <button onClick={() => removeSlot(idx)} className="text-ink-faint hover:text-danger"><Trash2 size={15} /></button>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={addSlot}>Add slot</Button>
        <Button size="sm" onClick={handleSave} loading={saving}>Save</Button>
      </div>
    </Card>
  );
}

function AccountTab({ logout }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [role, setRole] = useState(user?.role || 'PARENT');
  const [savingRole, setSavingRole] = useState(false);

  const ROLE_OPTIONS = [
    { value: 'TEACHER', label: 'Teacher' },
    { value: 'PARENT', label: 'Parent' },
    { value: 'STUDENT', label: 'Student' },
    { value: 'ADMIN', label: 'School Admin' },
  ];

  const handleSaveRole = async () => {
    if (role === user?.role) return;
    setSavingRole(true);
    try {
      const { data } = await updateProfile({ role });
      setUser(data);
      toast.success('Role updated — please sign in again for the change to take full effect.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update role');
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <Card className="max-w-lg space-y-5">
      {/* Role correction — important for Google sign-in users who got wrong role */}
      <div>
        <h3 className="font-semibold text-ink mb-1">Your role</h3>
        <p className="text-sm text-ink-mute mb-3">
          If you signed in with Google and got assigned the wrong role (e.g. "Parent" instead of "Teacher"),
          change it here then sign out and back in.
        </p>
        <div className="flex gap-2 flex-wrap">
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              className={`px-3 py-1.5 rounded-btn text-sm font-medium border transition-colors ${
                role === r.value
                  ? 'bg-brand text-white border-brand'
                  : 'border-gray-300 text-ink-mute hover:border-brand hover:text-brand'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {role !== user?.role && (
          <Button className="mt-3" size="sm" onClick={handleSaveRole} loading={savingRole}>
            Save role
          </Button>
        )}
      </div>

      <div className="pt-1 border-t border-gray-100">
        <h3 className="font-semibold text-ink mb-1">Sign out</h3>
        <p className="text-sm text-ink-mute mb-3">You'll need to sign in again to access your messages.</p>
        <Button variant="outline" icon={LogOut} onClick={logout}>Sign out</Button>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h3 className="font-semibold text-danger mb-1">Delete account</h3>
        <p className="text-sm text-ink-mute mb-3">This permanently removes your account and message history. This cannot be undone.</p>
        <Button variant="danger" icon={Trash2}>Delete my account</Button>
      </div>
    </Card>
  );
}