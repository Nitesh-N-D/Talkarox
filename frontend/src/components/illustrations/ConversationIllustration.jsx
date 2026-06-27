// Original illustration — "The Conversation" — signature hero art for Talkarox.
// Hand-built SVG scene representing the core idea: a private, warm channel
// between a teacher and a parent, with the breathing-pulse motif echoed
// in the connecting line between them.
export default function ConversationIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 480 360"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Illustration of a teacher and a parent connected by a secure message thread"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EFF4FF" />
          <stop offset="100%" stopColor="#FCFBF8" />
        </linearGradient>
        <linearGradient id="cardGradBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="cardGradGreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="480" height="360" rx="24" fill="url(#skyGrad)" />

      {/* Floating background shapes for depth */}
      <circle cx="60" cy="70" r="36" fill="#DBE8FE" opacity="0.6" />
      <circle cx="420" cy="290" r="50" fill="#D1FAE5" opacity="0.5" />
      <circle cx="440" cy="60" r="20" fill="#FEF3C7" opacity="0.7" />

      {/* Connecting pulse line between the two figures */}
      <path
        d="M150 200 C 210 160, 270 160, 330 200"
        stroke="#2563EB"
        strokeWidth="2.5"
        strokeDasharray="6 8"
        opacity="0.45"
      />
      <circle cx="240" cy="178" r="26" fill="url(#glow)" />

      {/* Teacher figure (left) */}
      <g transform="translate(90, 150)">
        <rect x="0" y="40" width="84" height="100" rx="20" fill="url(#cardGradBlue)" />
        <circle cx="42" cy="22" r="34" fill="#FFD9B3" />
        <path d="M10 14C10 -4 74 -4 74 14C74 22 70 24 64 20C56 14 28 14 20 20C14 24 10 22 10 14Z" fill="#1F2937" />
        <circle cx="30" cy="22" r="3.2" fill="#1F2937" />
        <circle cx="54" cy="22" r="3.2" fill="#1F2937" />
        <path d="M32 32 Q42 38 52 32" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* breathing status ring */}
        <circle cx="74" cy="58" r="9" fill="#FFFFFF" />
        <circle cx="74" cy="58" r="5" fill="#10B981" />
        <circle cx="74" cy="58" r="9" stroke="#10B981" strokeWidth="2" opacity="0.5">
          <animate attributeName="r" values="9;15;9" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Parent figure (right) */}
      <g transform="translate(300, 150)">
        <rect x="0" y="40" width="84" height="100" rx="20" fill="url(#cardGradGreen)" />
        <circle cx="42" cy="22" r="34" fill="#F4C9A8" />
        <path d="M8 18C8 -2 76 -2 76 18C76 30 70 18 64 16C56 13 28 13 20 16C14 18 8 30 8 18Z" fill="#3B2A20" />
        <circle cx="30" cy="24" r="3.2" fill="#1F2937" />
        <circle cx="54" cy="24" r="3.2" fill="#1F2937" />
        <path d="M32 34 Q42 40 52 34" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="10" cy="58" r="9" fill="#FFFFFF" />
        <circle cx="10" cy="58" r="5" fill="#F59E0B" />
      </g>

      {/* Floating message bubble above the connection */}
      <g transform="translate(204, 96)">
        <rect width="72" height="40" rx="12" fill="#FFFFFF" stroke="#E5E7EB" />
        <rect x="10" y="12" width="36" height="4" rx="2" fill="#BFD7FE" />
        <rect x="10" y="22" width="52" height="4" rx="2" fill="#E5E7EB" />
        <path d="M28 40 L24 48 L36 40 Z" fill="#FFFFFF" stroke="#E5E7EB" />
      </g>

      {/* Ground line */}
      <path d="M40 280 Q240 300 440 280" stroke="#E5E7EB" strokeWidth="2" />
    </svg>
  );
}
