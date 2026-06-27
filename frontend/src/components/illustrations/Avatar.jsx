// Generates a deterministic, photo-quality-feeling avatar (gradient blob +
// initials) for any user — no external avatar service, no generic icon.
// Same name+id always produces the same avatar, so it feels like a real
// per-person identity rather than a random placeholder.

const PALETTES = [
  ['#2563EB', '#1D4ED8'],
  ['#10B981', '#047857'],
  ['#F59E0B', '#B45309'],
  ['#7C3AED', '#5B21B6'],
  ['#0EA5E9', '#0369A1'],
  ['#EC4899', '#BE185D'],
  ['#14B8A6', '#0F766E'],
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name = 'User', id = '', size = 40, className = '' }) {
  const seed = hashString(id || name);
  const [from, to] = PALETTES[seed % PALETTES.length];
  const initials = getInitials(name);
  const gradId = `avgrad-${seed}`;

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={name}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill={`url(#${gradId})`} />
      <text
        x="20"
        y="21"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontWeight="700"
        fontSize="15"
        fill="#FFFFFF"
      >
        {initials}
      </text>
    </svg>
  );
}
