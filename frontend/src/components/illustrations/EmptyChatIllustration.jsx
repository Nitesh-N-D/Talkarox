// Original illustration for empty chat states — an open envelope with a
// sprouting plant, tying "growth" (brand green) to "starting a conversation."
export default function EmptyChatIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 240 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="An open envelope with a small plant growing from it"
    >
      <defs>
        <linearGradient id="envGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F3F4F6" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="172" rx="70" ry="10" fill="#E5E7EB" opacity="0.6" />
      <rect x="50" y="90" width="140" height="86" rx="14" fill="url(#envGrad)" stroke="#E5E7EB" strokeWidth="2" />
      <path d="M50 100 L120 150 L190 100" stroke="#D1D5DB" strokeWidth="2.5" fill="none" />
      <path d="M50 100 L120 50 L190 100" stroke="#D1D5DB" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      {/* sprout growing out of the envelope */}
      <path d="M120 90 C 118 70, 124 55, 116 40" stroke="#10B981" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M118 64 C 104 60, 96 48, 100 36" stroke="#10B981" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M119 50 C 132 46, 140 34, 138 22" stroke="#34D399" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="116" cy="38" r="7" fill="#D1FAE5" />
      <circle cx="100" cy="34" r="6" fill="#A7F3D0" />
      <circle cx="138" cy="20" r="6.5" fill="#6EE7B7" />
    </svg>
  );
}
