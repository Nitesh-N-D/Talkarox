import { Zap, Clock } from 'lucide-react';

export default function ResponseBadge({ avgResponseMinutes, compact = false }) {
  // null means "not enough message history yet to compute this" — show that
  // honestly rather than inventing a number or hiding the badge silently.
  if (avgResponseMinutes == null) {
    const label = 'Not enough activity yet';
    if (compact) {
      return <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-faint">{label}</span>;
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-paper-flat text-ink-faint">
        <Clock size={12} /> {label}
      </div>
    );
  }

  const isFast = avgResponseMinutes <= 60;
  const label =
    avgResponseMinutes < 60
      ? `Typically replies in ${avgResponseMinutes} min`
      : `Typically replies in ${Math.round(avgResponseMinutes / 60)} hr`;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${isFast ? 'text-grow-700' : 'text-ink-faint'}`}>
        {isFast && <Zap size={11} className="fill-grow-600 text-grow-600" />}
        {label}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isFast ? 'bg-grow-50 text-grow-700' : 'bg-paper-flat text-ink-mute'}`}>
      {isFast ? <Zap size={12} className="fill-grow-600" /> : <Clock size={12} />}
      {label}
    </div>
  );
}
