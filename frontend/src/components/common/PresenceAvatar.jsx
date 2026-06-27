import { motion } from 'framer-motion';
import Avatar from '../illustrations/Avatar';

const STATUS_CONFIG = {
  ONLINE: { color: '#10B981', label: 'Online', breathe: true, speed: 2.5 },
  TEACHING: { color: '#2563EB', label: 'Teaching', breathe: true, speed: 2.5 },
  AVAILABLE: { color: '#10B981', label: 'Available', breathe: true, speed: 2.5 },
  OFFICE_HOURS: { color: '#7C3AED', label: 'Office hours', breathe: true, speed: 2.5 },
  AWAY: { color: '#F59E0B', label: 'Away', breathe: true, speed: 4 },
  DO_NOT_DISTURB: { color: '#EF4444', label: 'Do not disturb', breathe: false, speed: 0 },
  OFFLINE: { color: '#D1D5DB', label: 'Offline', breathe: false, speed: 0 },
};

const SIZE_MAP = {
  sm: { avatar: 28, dot: 8, ring: -3 },
  md: { avatar: 40, dot: 11, ring: -4 },
  lg: { avatar: 56, dot: 14, ring: -5 },
  xl: { avatar: 88, dot: 18, ring: -6 },
};

/**
 * PresenceAvatar — Talkarox's signature UI element.
 * A breathing pulse ring around the avatar communicates live presence
 * at a glance. Used consistently across chat, dashboard, and directories
 * so the motif reads as one coherent idea throughout the app.
 */
export default function PresenceAvatar({
  name,
  userId,
  status = 'OFFLINE',
  size = 'md',
  showLabel = false,
  className = '',
}) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.OFFLINE;
  const dims = SIZE_MAP[size];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative inline-block" style={{ width: dims.avatar, height: dims.avatar }}>
        <Avatar name={name} id={userId} size={dims.avatar} />

        {cfg.breathe && (
          <motion.span
            aria-hidden="true"
            className="absolute rounded-full border-2"
            style={{
              inset: dims.ring,
              borderColor: cfg.color,
            }}
            animate={{ scale: [1, 1.32, 1], opacity: [0.8, 0.15, 0.8] }}
            transition={{ duration: cfg.speed, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <span
          aria-hidden="true"
          className="absolute rounded-full border-2 border-paper-card"
          style={{
            width: dims.dot,
            height: dims.dot,
            bottom: -1,
            right: -1,
            backgroundColor: cfg.color,
          }}
        />
      </div>

      {showLabel && (
        <span className="text-sm font-medium text-ink-mute">{cfg.label}</span>
      )}
      <span className="sr-only">{cfg.label}</span>
    </div>
  );
}

export { STATUS_CONFIG };
