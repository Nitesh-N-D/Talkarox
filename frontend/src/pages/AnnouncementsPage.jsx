import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Plus, Pin, AlertTriangle, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/common/Primitives';
import { Input, TextArea, Select } from '../components/common/Primitives';
import Button from '../components/common/Button';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { getAnnouncementFeed, createAnnouncement, triggerEmergencyBroadcast } from '../services/api';
import { emitEmergencyBroadcast } from '../services/socket';

const TYPE_STYLE = {
  INFO: { bg: 'bg-brand-50', text: 'text-brand-700', dot: 'bg-brand-600' },
  IMPORTANT: { bg: 'bg-warmth-50', text: 'text-warmth-700', dot: 'bg-warmth-600' },
  URGENT: { bg: 'bg-danger-50', text: 'text-danger-700', dot: 'bg-danger-600' },
  EVENT: { bg: 'bg-grow-50', text: 'text-grow-700', dot: 'bg-grow-600' },
};

export default function AnnouncementsPage() {
  const user = useAuthStore((s) => s.user);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const canCreate = ['ADMIN', 'TEACHER'].includes(user?.role);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getAnnouncementFeed(user.schoolId);
      setAnnouncements(data);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Announcements</h1>
          <p className="text-ink-mute mt-1">School-wide updates, pinned to the top when they matter most.</p>
        </div>
        {canCreate && (
          <div className="flex gap-2">
            {user.role === 'ADMIN' && (
              <Button variant="danger" size="sm" icon={AlertTriangle} onClick={() => setShowEmergency(true)}>
                Emergency
              </Button>
            )}
            <Button size="sm" icon={Plus} onClick={() => setShowCreate(true)}>New post</Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-card skeleton-shimmer animate-shimmer" />)}
        </div>
      ) : announcements.length === 0 ? (
        <Card className="text-center py-12">
          <Megaphone size={36} className="text-ink-faint mx-auto mb-3" />
          <p className="font-semibold text-ink">No announcements yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </div>
      )}

      {showCreate && <CreateAnnouncementModal onClose={() => setShowCreate(false)} onCreated={load} schoolId={user.schoolId} />}
      {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} schoolId={user.schoolId} />}
    </div>
  );
}

function AnnouncementCard({ announcement }) {
  const style = TYPE_STYLE[announcement.type] || TYPE_STYLE.INFO;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            {announcement.pinned && <Pin size={13} className="text-warmth-600" />}
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} /> {announcement.type}
            </span>
          </div>
          <span className="text-xs text-ink-faint flex-shrink-0">
            {new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <h3 className="font-display font-bold text-ink mb-1.5">{announcement.title}</h3>
        <p className="text-sm text-ink-soft leading-relaxed">{announcement.content}</p>
        <p className="text-xs text-ink-faint mt-3 flex items-center gap-1.5">
          <Users size={12} /> Read by {announcement.readByParents || 0} parents, {announcement.readByStudents || 0} students
        </p>
      </Card>
    </motion.div>
  );
}

function CreateAnnouncementModal({ onClose, onCreated, schoolId }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('INFO');
  const [target, setTarget] = useState('SCHOOL_WIDE');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Add a title and message');
      return;
    }
    setSubmitting(true);
    try {
      await createAnnouncement({ schoolId, title, content, type, target });
      toast.success('Announcement posted');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-card shadow-lifted w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-ink">New announcement</h3>
          <button onClick={onClose}><X size={18} className="text-ink-faint" /></button>
        </div>
        <div className="space-y-3">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Parent-teacher meeting this Friday" />
          <TextArea label="Message" rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Details for everyone to see…" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={type} onChange={(e) => setType(e.target.value)} options={[
              { value: 'INFO', label: 'Info' }, { value: 'IMPORTANT', label: 'Important' }, { value: 'URGENT', label: 'Urgent' }, { value: 'EVENT', label: 'Event' },
            ]} />
            <Select label="Audience" value={target} onChange={(e) => setTarget(e.target.value)} options={[
              { value: 'SCHOOL_WIDE', label: 'Everyone' }, { value: 'PARENTS', label: 'Parents' }, { value: 'TEACHERS', label: 'Teachers' }, { value: 'STUDENTS', label: 'Students' },
            ]} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Post announcement</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EmergencyModal({ onClose, schoolId }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const setEmergencyBroadcast = useUIStore((s) => s.setEmergencyBroadcast);

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Add a title and message');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await triggerEmergencyBroadcast({ schoolId, title, message });
      emitEmergencyBroadcast(schoolId, { id: data.id, title, message });
      setEmergencyBroadcast(data);
      toast.success('Emergency broadcast sent to everyone');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send broadcast');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-card shadow-lifted w-full max-w-md p-5 border-2 border-danger-100">
        <div className="flex items-center gap-2.5 mb-4">
          <AlertTriangle className="text-danger" size={22} />
          <h3 className="font-display font-bold text-ink">Send emergency broadcast</h3>
        </div>
        <p className="text-xs text-ink-faint mb-4">This appears immediately on every screen in your school. Use only for genuine emergencies.</p>
        <div className="space-y-3">
          <Input label="Headline" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="School closed today" />
          <TextArea label="Details" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Due to heavy rain, school is closed for the day." />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={handleSubmit} loading={submitting}>Broadcast now</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
