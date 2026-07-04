import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Video, Calendar, Check, X as XIcon, Clock, Plus, Search, UserSearch } from 'lucide-react';
import debounce from 'lodash/debounce';
import toast from 'react-hot-toast';
import { Card } from '../components/common/Primitives';
import Button from '../components/common/Button';
import PresenceAvatar from '../components/common/PresenceAvatar';
import AppointmentRequestModal from '../components/appointments/AppointmentRequestModal';
import { getMyAppointments, confirmAppointment, cancelAppointment, searchTeachers } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const STATUS_STYLE = {
  PENDING:   { bg: 'bg-warmth-50', text: 'text-warmth-700', label: 'Awaiting confirmation' },
  CONFIRMED: { bg: 'bg-grow-50',   text: 'text-grow-700',   label: 'Confirmed' },
  CANCELLED: { bg: 'bg-gray-100',  text: 'text-ink-faint',  label: 'Cancelled' },
  COMPLETED: { bg: 'bg-gray-100',  text: 'text-ink-faint',  label: 'Completed' },
};

export default function AppointmentsPage() {
  const user = useAuthStore((s) => s.user);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDirectory, setShowDirectory] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getMyAppointments();
      setAppointments(data);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleConfirm = async (id) => {
    try { await confirmAppointment(id); toast.success('Meeting confirmed!'); load(); }
    catch { toast.error('Could not confirm meeting'); }
  };

  const handleCancel = async (id) => {
    try { await cancelAppointment(id); toast.success('Meeting cancelled'); load(); }
    catch { toast.error('Could not cancel meeting'); }
  };

  const handleTeacherSelected = (teacher) => {
    setShowDirectory(false);
    // Normalise to the shape AppointmentRequestModal expects (teacher.userId + teacher.name)
    setSelectedTeacher({ userId: teacher.id, name: teacher.fullName, ...teacher });
  };

  const upcoming = appointments.filter(
    (a) => a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && new Date(a.scheduledAt) >= new Date()
  );
  const past = appointments.filter(
    (a) => a.status === 'CANCELLED' || a.status === 'COMPLETED' || new Date(a.scheduledAt) < new Date()
  );

  const canBook = user?.role === 'PARENT' || user?.role === 'STUDENT' || user?.role === 'ADMIN';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Appointments</h1>
          <p className="text-ink-mute mt-1">
            {user?.role === 'TEACHER'
              ? 'Meetings parents have requested with you.'
              : 'Book a meeting with any teacher during their office hours.'}
          </p>
        </div>
        {canBook && (
          <Button icon={Plus} onClick={() => setShowDirectory(true)}>
            Book a meeting
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-card skeleton-shimmer animate-shimmer" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card className="text-center py-14">
          <Calendar size={40} className="text-ink-faint mx-auto mb-4" />
          <p className="font-semibold text-ink">No meetings scheduled yet</p>
          {canBook ? (
            <>
              <p className="text-sm text-ink-mute mt-1 mb-5">
                Find a teacher and pick a slot that fits their office hours.
              </p>
              <Button icon={UserSearch} onClick={() => setShowDirectory(true)}>
                Find a teacher to meet
              </Button>
            </>
          ) : (
            <p className="text-sm text-ink-mute mt-1">
              Parents will see their meeting requests here once booked.
            </p>
          )}
        </Card>
      ) : (
        <div className="space-y-7">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-ink-mute uppercase tracking-wider mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} user={user} onConfirm={handleConfirm} onCancel={handleCancel} />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-ink-mute uppercase tracking-wider mb-3">Past & cancelled</h2>
              <div className="space-y-3 opacity-60">
                {past.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} user={user} onConfirm={handleConfirm} onCancel={handleCancel} readOnly />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Teacher Directory Modal (step 1: pick teacher) */}
      {showDirectory && (
        <TeacherPickerModal
          user={user}
          onSelect={handleTeacherSelected}
          onClose={() => setShowDirectory(false)}
        />
      )}

      {/* Appointment Slot Modal (step 2: pick slot) */}
      {selectedTeacher && (
        <AppointmentRequestModal
          teacher={selectedTeacher}
          onClose={() => { setSelectedTeacher(null); load(); }}
        />
      )}
    </div>
  );
}

/* ── Appointment card ── */
function AppointmentCard({ appointment, user, onConfirm, onCancel, readOnly }) {
  const style = STATUS_STYLE[appointment.status] || STATUS_STYLE.PENDING;
  const otherParty = user.role === 'TEACHER' ? appointment.parentName : appointment.teacherName;
  const date = new Date(appointment.scheduledAt);
  const isTeacherAndPending = user.role === 'TEACHER' && appointment.status === 'PENDING';
  const isUpcoming = new Date(appointment.scheduledAt) >= new Date();

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <PresenceAvatar name={otherParty || '?'} userId={appointment.id} status="OFFLINE" size="md" />
            <div>
              <p className="font-semibold text-ink text-sm">{otherParty || 'Unknown'}</p>
              <p className="text-xs text-ink-faint flex items-center gap-1.5">
                <Clock size={11} />
                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {' at '}
                {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
            {style.label}
          </span>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {appointment.zoomUrl && appointment.status === 'CONFIRMED' && isUpcoming && (
              <a href={appointment.zoomUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" icon={Video}>Join video call</Button>
              </a>
            )}
            {isTeacherAndPending && (
              <Button size="sm" variant="secondary" icon={Check} onClick={() => onConfirm(appointment.id)}>
                Confirm
              </Button>
            )}
            {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
              <Button size="sm" variant="ghost" icon={XIcon} onClick={() => onCancel(appointment.id)}>
                Cancel
              </Button>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

/* ── Teacher picker (step 1 of booking flow) ── */
function TeacherPickerModal({ user, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTeachers = useCallback(
    debounce(async (q) => {
      if (!user?.schoolId) return;
      setLoading(true);
      try {
        const { data } = await searchTeachers(q || undefined, user.schoolId);
        setTeachers(data);
      } catch {
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [user?.schoolId]
  );

  useEffect(() => { fetchTeachers(query); }, [query, fetchTeachers]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-ink/40 z-50 flex items-start justify-center pt-16 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-card shadow-lifted w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-display font-bold text-ink">Choose a teacher</h3>
            <p className="text-xs text-ink-faint mt-0.5">Then pick an open slot during their office hours</p>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink">
            <XIcon size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              autoFocus
              className="w-full rounded-input border border-gray-300 pl-9 pr-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>
        </div>

        {/* Teacher list */}
        <div className="overflow-y-auto max-h-80">
          {!user?.schoolId ? (
            <p className="text-sm text-ink-faint text-center py-10 px-6">
              You need to join a school before booking meetings.
              Go to <strong>Settings → Profile</strong> to complete setup.
            </p>
          ) : loading ? (
            <div className="space-y-1 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-full skeleton-shimmer animate-shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/3 rounded skeleton-shimmer animate-shimmer" />
                    <div className="h-2.5 w-1/3 rounded skeleton-shimmer animate-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : teachers.length === 0 ? (
            <p className="text-sm text-ink-faint text-center py-10">
              No teachers found. Try a different search.
            </p>
          ) : (
            teachers.map((teacher) => (
              <button
                key={teacher.id}
                onClick={() => onSelect(teacher)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-paper-flat
                           transition-colors text-left border-b border-gray-50 last:border-0"
              >
                <PresenceAvatar
                  name={teacher.fullName}
                  userId={teacher.id}
                  status={teacher.status || 'OFFLINE'}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink text-sm truncate">{teacher.fullName}</p>
                  <p className="text-xs text-ink-faint truncate">{teacher.bio || 'Teacher'}</p>
                </div>
                {teacher.avgResponseMinutes != null && (
                  <span className="text-[11px] text-grow-700 bg-grow-50 px-2 py-0.5
                                   rounded-full flex-shrink-0 font-medium whitespace-nowrap">
                    ~{teacher.avgResponseMinutes}m reply
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}