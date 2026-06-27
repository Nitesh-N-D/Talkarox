import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Clock, Plus, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import { Input, Select } from '../components/common/Primitives';
import Button from '../components/common/Button';
import Avatar from '../components/illustrations/Avatar';
import { updateProfile, setOfficeHours, uploadAvatar } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, schoolId } = location.state || {};
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [bio, setBio] = useState('');
  const [slots, setSlots] = useState(
    role === 'TEACHER' ? [{ dayOfWeek: 1, startTime: '16:00', endTime: '18:00', availableFor: 'PARENTS' }] : []
  );
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

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
      toast.success('Photo added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not upload photo right now — you can add one later from Settings');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const addSlot = () => setSlots((s) => [...s, { dayOfWeek: 1, startTime: '16:00', endTime: '18:00', availableFor: 'PARENTS' }]);
  const removeSlot = (idx) => setSlots((s) => s.filter((_, i) => i !== idx));
  const updateSlot = (idx, key, value) => setSlots((s) => s.map((slot, i) => (i === idx ? { ...slot, [key]: value } : slot)));

  const handleFinish = async () => {
    setSaving(true);
    try {
      const { data } = await updateProfile({ schoolId, bio, onboardingComplete: true });
      setUser(data);
      if (role === 'TEACHER' && slots.length > 0) {
        await setOfficeHours(user.id, slots);
      }
      toast.success('You\u2019re all set!');
      navigate('/onboarding/tour');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthLayout title="Complete your profile" subtitle="Just a couple more details and you're in.">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <Avatar name={user?.fullName || 'You'} id={user?.id} size={64} />
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center shadow-card hover:bg-brand-700 disabled:opacity-60"
              aria-label="Upload avatar photo"
            >
              {uploadingAvatar ? <Loader2 size={13} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
          </div>
          <div>
            <p className="font-semibold text-ink">{user?.fullName}</p>
            <p className="text-xs text-ink-faint">Tap the camera icon to add a photo</p>
          </div>
        </div>

        <Input
          label="Short bio (optional)"
          placeholder={role === 'TEACHER' ? 'Mathematics, Grade 8 \u2013 9' : 'A little about you'}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        {role === 'TEACHER' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-ink-soft flex items-center gap-1.5">
                <Clock size={15} /> Your office hours
              </p>
              <button onClick={addSlot} className="text-xs font-semibold text-brand flex items-center gap-1 hover:underline">
                <Plus size={13} /> Add slot
              </button>
            </div>
            <p className="text-xs text-ink-faint mb-3">Parents will see exactly when you're reachable.</p>
            <div className="space-y-2.5">
              {slots.map((slot, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 bg-paper-flat p-2.5 rounded-card">
                  <Select
                    options={DAYS.map((d, i) => ({ value: i, label: d }))}
                    value={slot.dayOfWeek}
                    onChange={(e) => updateSlot(idx, 'dayOfWeek', Number(e.target.value))}
                    className="!py-2 text-xs flex-shrink-0 w-28"
                  />
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(idx, 'startTime', e.target.value)}
                    className="rounded-input border border-gray-300 px-2 py-2 text-xs flex-1 min-w-0"
                  />
                  <span className="text-ink-faint text-xs">–</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(idx, 'endTime', e.target.value)}
                    className="rounded-input border border-gray-300 px-2 py-2 text-xs flex-1 min-w-0"
                  />
                  <button onClick={() => removeSlot(idx)} className="text-ink-faint hover:text-danger flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <Button fullWidth onClick={handleFinish} loading={saving}>
          Finish setup
        </Button>
      </div>
    </AuthLayout>
  );
}
