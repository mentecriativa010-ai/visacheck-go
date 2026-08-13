export function ComplianceScanVisual() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <style>{`
        @keyframes scan-sweep {
          0%   { transform: translateX(-8%); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateX(108%); opacity: 0; }
        }
        @keyframes mark-pop {
          0%, 40% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .scan-line {
          animation: scan-sweep 3.2s ease-in-out infinite;
        }
        .mark-1 { animation: mark-pop 3.2s ease-out infinite; animation-delay: 0.9s; }
        .mark-2 { animation: mark-pop 3.2s ease-out infinite; animation-delay: 1.6s; }
        .mark-3 { animation: mark-pop 3.2s ease-out infinite; animation-delay: 2.3s; }
        @media (prefers-reduced-motion: reduce) {
          .scan-line, .mark-1, .mark-2, .mark-3 { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      <svg viewBox="0 0 400 320" className="w-full h-auto" role="img" aria-label="Planta baixa sendo verificada automaticamente, com itens marcados como conformes ou não conformes">
        <rect x="0" y="0" width="400" height="320" rx="16" fill="#F7F4EC" />

        {/* Floor plan lines */}
        <g stroke="#0F2A4A" strokeWidth="2.5" fill="none" opacity="0.55">
          <rect x="30" y="30" width="340" height="260" rx="4" />
          <line x1="30" y1="140" x2="210" y2="140" />
          <line x1="210" y1="30" x2="210" y2="290" />
          <line x1="210" y1="200" x2="370" y2="200" />
          <line x1="100" y1="30" x2="100" y2="140" />
        </g>

        {/* Room labels */}
        <g fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#5A7185">
          <text x="42" y="90">CONSULTÓRIO</text>
          <text x="222" y="90">UTI</text>
          <text x="42" y="220">CIRURGIA</text>
          <text x="222" y="250">CME</text>
        </g>

        {/* Compliance marks */}
        <g className="mark-1">
          <circle cx="150" cy="100" r="14" fill="#22C79A" />
          <path d="M143 100 L148 106 L158 92" stroke="#F7F4EC" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g className="mark-2">
          <circle cx="290" cy="110" r="14" fill="#E2634A" />
          <line x1="284" y1="104" x2="296" y2="116" stroke="#F7F4EC" strokeWidth="3" strokeLinecap="round" />
          <line x1="296" y1="104" x2="284" y2="116" stroke="#F7F4EC" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g className="mark-3">
          <circle cx="130" cy="230" r="14" fill="#22C79A" />
          <path d="M123 230 L128 236 L138 222" stroke="#F7F4EC" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Scanning sweep line */}
        <rect className="scan-line" x="0" y="30" width="14" height="260" fill="url(#scanGradient)" />
        <defs>
          <linearGradient id="scanGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22C79A" stopOpacity="0" />
            <stop offset="50%" stopColor="#22C79A" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#22C79A" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
