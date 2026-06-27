export default function Logo({ size = 'md', showWordmark = true, className = '' }) {
  const dims = { sm: 28, md: 34, lg: 44 }[size];
  const textSize = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl' }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={dims} height={dims} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#logoGrad)" />
        <circle cx="32" cy="32" r="11" fill="#FFFFFF" />
        <circle cx="32" cy="32" r="16" fill="none" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.55" />
        <circle cx="32" cy="32" r="21" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.25" />
      </svg>
      {showWordmark && (
        <span className={`font-display font-extrabold ${textSize} text-ink tracking-tight`}>
          Talkarox
        </span>
      )}
    </div>
  );
}
