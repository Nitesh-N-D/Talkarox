import { useState } from 'react';
import { CalendarPlus, FileText, Clock } from 'lucide-react';
import PresenceAvatar from '../common/PresenceAvatar';
import ResponseBadge from '../dashboard/ResponseBadge';
import Button from '../common/Button';
import HomeworkHelperPanel from './HomeworkHelperPanel';
import AppointmentRequestModal from '../appointments/AppointmentRequestModal';

export default function ChatContextPanel({ contact, role }) {
  const [showAppointment, setShowAppointment] = useState(false);

  if (!contact) {
    return <div className="p-6 text-center text-sm text-ink-faint">Select a conversation to see details.</div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-5 text-center border-b border-gray-100">
        <div className="flex justify-center mb-3">
          <PresenceAvatar name={contact.name} userId={contact.userId} status={contact.status} size="xl" />
        </div>
        <p className="font-display font-bold text-ink mt-2">{contact.name}</p>
        <p className="text-xs text-ink-faint mb-2">{contact.roleLabel || '\u00A0'}</p>
        {contact.avgResponseMinutes && <ResponseBadge avgResponseMinutes={contact.avgResponseMinutes} />}
      </div>

      {contact.officeHours?.length > 0 && (
        <div className="p-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-ink-mute mb-2 flex items-center gap-1.5">
            <Clock size={13} /> Office hours
          </p>
          <div className="space-y-1.5">
            {contact.officeHours.map((slot, i) => (
              <div key={i} className="flex justify-between text-xs text-ink-soft">
                <span>{slot.day}</span>
                <span className="font-mono">{slot.startTime}–{slot.endTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {role !== 'STUDENT' && (
        <div className="p-5 border-b border-gray-100">
          <Button size="sm" variant="outline" fullWidth icon={CalendarPlus} onClick={() => setShowAppointment(true)}>
            Request a meeting
          </Button>
        </div>
      )}

      {contact.sharedFiles?.length > 0 && (
        <div className="p-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-ink-mute mb-2 flex items-center gap-1.5">
            <FileText size={13} /> Shared files
          </p>
          <div className="space-y-1.5">
            {contact.sharedFiles.map((f, i) => (
              <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-brand hover:underline truncate">{f.name}</a>
            ))}
          </div>
        </div>
      )}

      <div className="border-t-4 border-paper-flat">
        <HomeworkHelperPanel onAskTeacher={() => setShowAppointment(false)} />
      </div>

      {showAppointment && (
        <AppointmentRequestModal teacher={contact} onClose={() => setShowAppointment(false)} />
      )}
    </div>
  );
}
