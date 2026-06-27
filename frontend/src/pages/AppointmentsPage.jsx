import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Calendar, Check, X as XIcon, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/common/Primitives';
import Button from '../components/common/Button';
import PresenceAvatar from '../components/common/PresenceAvatar';
import { getMyAppointments, confirmAppointment, cancelAppointment } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const STATUS_STYLE = {
  PENDING: { bg: 'bg-warmth-50', text: 'text-warmth-700', label: 'Awaiting confirmation' },
  CONFIRMED: { bg: 'bg-grow-50', text: 'text-grow-700', label: 'Confirmed' },
  CANCELLED: { bg: 'bg-gray-100', text: 'text-ink-faint', label: 'Cancelled' },
};

export default function AppointmentsPage() {
  const user = useAuthStore((s) => s.user);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

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
    try {
      await confirmAppointment(id);
      toast.success('Meeting confirmed');
      load();
    } catch {
      toast.error('Could not confirm meeting');
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelAppointment(id);
      toast.success('Meeting cancelled');
      load();
    } catch {
      toast.error('Could not cancel meeting');
    }
  };

  const upcoming = appointments.filter((a) => a.status !== 'CANCELLED' && new Date(a.scheduledAt) >= new Date());
  const past = appointments.filter((a) => a.status === 'CANCELLED' || new Date(a.scheduledAt) < new Date());

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Appointments</h1>
        <p className="text-ink-mute mt-1">Meetings booked through office hours, with auto-generated video links.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-card skeleton-shimmer animate-shimmer" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card className="text-center py-12">
          <Calendar size={36} className="text-ink-faint mx-auto mb-3" />
          <p className="font-semibold text-ink">No meetings scheduled yet</p>
          <p className="text-sm text-ink-faint mt-1">Request one from any teacher's chat profile.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-ink-mute mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} user={user} onConfirm={handleConfirm} onCancel={handleCancel} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-ink-mute mb-3">Past & cancelled</h2>
              <div className="space-y-3 opacity-60">
                {past.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} user={user} onConfirm={handleConfirm} onCancel={handleCancel} readOnly />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appointment, user, onConfirm, onCancel, readOnly }) {
  const style = STATUS_STYLE[appointment.status] || STATUS_STYLE.PENDING;
  const otherParty = user.role === 'TEACHER' ? appointment.parentName : appointment.teacherName;
  const date = new Date(appointment.scheduledAt);
  const isTeacherAndPending = user.role === 'TEACHER' && appointment.status === 'PENDING';

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <PresenceAvatar name={otherParty} userId={appointment.id} status="OFFLINE" size="md" />
            <div>
              <p className="font-semibold text-ink text-sm">{otherParty}</p>
              <p className="text-xs text-ink-faint flex items-center gap-1.5">
                <Clock size={11} /> {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>{style.label}</span>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 mt-4">
            {appointment.zoomUrl && appointment.status === 'CONFIRMED' && (
              <a href={appointment.zoomUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" icon={Video}>Join video call</Button>
              </a>
            )}
            {isTeacherAndPending && (
              <Button size="sm" variant="secondary" icon={Check} onClick={() => onConfirm(appointment.id)}>Confirm</Button>
            )}
            <Button size="sm" variant="ghost" icon={XIcon} onClick={() => onCancel(appointment.id)}>Cancel</Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
