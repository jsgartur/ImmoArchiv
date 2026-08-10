/** ImmoArchiv-Logo: blaues Haus in abgerundetem Hexagon. */
export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="immoarchiv-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1e40af" />
        </linearGradient>
      </defs>
      {/* Hexagon */}
      <path d="M32 2.5 58 17.5 58 46.5 32 61.5 6 46.5 6 17.5Z" fill="url(#immoarchiv-grad)" />
      {/* Schornstein */}
      <rect x="41" y="20" width="4.5" height="10" rx="1" fill="#1e3a8a" />
      {/* Dach */}
      <path d="M12.5 35 32 18.5 51.5 35Z" fill="#ffffff" />
      {/* Hauskörper */}
      <rect x="19" y="33.5" width="26" height="18" rx="1.5" fill="#ffffff" />
      {/* Fenster (4 Scheiben) */}
      <g fill="#1e40af">
        <rect x="23.5" y="38" width="4" height="4" rx="0.6" />
        <rect x="28.6" y="38" width="4" height="4" rx="0.6" />
        <rect x="23.5" y="43.1" width="4" height="4" rx="0.6" />
        <rect x="28.6" y="43.1" width="4" height="4" rx="0.6" />
      </g>
      {/* Tür */}
      <rect x="36" y="41" width="6" height="10.5" rx="0.8" fill="#2563eb" />
    </svg>
  );
}
