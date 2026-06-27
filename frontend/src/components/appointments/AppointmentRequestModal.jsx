import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import { getAvailableSlots, requestAppointment } from '../../services/api';

function getNextSevenDays() {
  const days = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function AppointmentRequestModal({ teacher, onClose }) {
  const [selectedDate, setSelectedDate] = useState(getNextSevenDays()[0]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const days = getNextSevenDays();

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAvailableSlots(teacher.userId, selectedDate.toISOString())
      .then(({ data }) => active && setSlots(data))
      .catch(() => active && setSlots([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [selectedDate, teacher.userId]);

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      await requestAppointment({
        teacherId: teacher.userId,
        scheduledAt: selectedSlot.startsAt,
      });
      toast.success('Meeting requested! You\u2019ll get a confirmation with the video link.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not book this slot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-card shadow-lifted w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-display font-bold text-ink">Request a meeting</h3>
            <p className="text-xs text-ink-faint">with {teacher.name}</p>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X size={18} /></button>
        </div>

        <div className="p-5">
          <p className="text-xs font-semibold text-ink-mute mb-2 flex items-center gap-1.5"><Calendar size={13} /> Choose a day</p>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {days.map((d) => {
              const active = d.toDateString() === selectedDate.toDateString();
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDate(d)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-card border text-xs font-semibold transition-colors ${
                    active ? 'bg-brand text-white border-brand' : 'border-gray-200 text-ink-soft hover:border-brand'
                  }`}
                >
                  <span>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="text-base">{d.getDate()}</span>
                </button>
              );
            })}
          </div>

          <p className="text-xs font-semibold text-ink-mute mb-2 flex items-center gap-1.5"><Clock size={13} /> Available times</p>
          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 rounded-input skeleton-shimmer animate-shimmer" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-ink-faint py-4 text-center">No open slots on this day. Try another date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.startsAt}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 rounded-input text-xs font-semibold border transition-colors ${
                    selectedSlot?.startsAt === slot.startsAt
                      ? 'bg-brand text-white border-brand'
                      : 'border-gray-200 text-ink-soft hover:border-brand'
                  }`}
                >
                  {new Date(slot.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </button>
              ))}
            </div>
          )}

          <p className="text-[11px] text-ink-faint mt-4 flex items-center gap-1.5">
            <Video size={12} /> A video link is generated automatically once confirmed.
          </p>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selectedSlot} loading={submitting}>Request meeting</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
