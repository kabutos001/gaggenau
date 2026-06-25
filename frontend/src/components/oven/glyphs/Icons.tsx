import type { ReactElement } from 'react';

import type { ButtonIcon } from '../types';

const S = 'currentColor';

// Heat-up indicator: red double-chevron + a heating bar (manual p12, your photo).
export function HeatUpGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 28" className={className} aria-hidden>
      <g stroke="#e8492b" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6,6 14,12 6,18" />
        <polyline points="15,6 23,12 15,18" />
      </g>
      <line
        x1="22"
        y1="23"
        x2="36"
        y2="23"
        stroke="#cfd6dd"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Door / stand-by glyph top-right of the reference photo.
export function DoorGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden>
      <rect x="5" y="4" width="15" height="20" rx="1.5" fill="none" stroke={S} strokeWidth="2.2" />
      <path
        d="M20 4 l4 3 v14 l-4 3"
        fill="none"
        stroke={S}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Faint standby "S" circle top-left of the photo.
export function StandbyGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden>
      <circle cx="14" cy="14" r="11" fill="none" stroke={S} strokeWidth="2" />
      <path
        d="M18 9 a6 4 0 0 0 -8 1 a3 3 0 0 0 3 3 h2 a3 3 0 0 1 0 6 a6 4 0 0 1 -8 -1"
        fill="none"
        stroke={S}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// WiFi arc glyph, bottom-left of the reference photos.
export function WifiGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 24" className={className} aria-hidden>
      <g fill="none" stroke={S} strokeWidth="2" strokeLinecap="round">
        <path d="M4 9 a14 14 0 0 1 20 0" />
        <path d="M8 13.5 a8 8 0 0 1 12 0" />
      </g>
      <circle cx="14" cy="19" r="1.8" fill={S} />
    </svg>
  );
}

// Small "connected appliance" stacked-rounds glyph next to the WiFi mark.
export function GridGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <g fill="none" stroke={S} strokeWidth="2">
        <rect x="5" y="4" width="14" height="7" rx="2.5" />
        <rect x="5" y="13" width="14" height="7" rx="2.5" />
      </g>
    </svg>
  );
}

// Food-probe / pen glyph far right of the photo.
export function ProbeGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 28" className={className} aria-hidden>
      <line x1="4" y1="22" x2="22" y2="6" stroke={S} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 4 l5 5 -3 3 -5 -5 z" fill={S} />
      <polyline
        points="25,14 29,14 27,17"
        fill="none"
        stroke={S}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const paths: Record<Exclude<ButtonIcon, 'none'>, ReactElement> = {
  left: (
    <polyline
      points="16,5 8,12 16,19"
      fill="none"
      stroke={S}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  right: (
    <polyline
      points="8,5 16,12 8,19"
      fill="none"
      stroke={S}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  confirm: (
    <path
      d="M18 5 v6 a3 3 0 0 1 -3 3 H7 m0 0 l4 -4 m-4 4 l4 4"
      fill="none"
      stroke={S}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  clear: (
    <text
      x="12"
      y="17"
      textAnchor="middle"
      fontSize="15"
      fontWeight="700"
      fill={S}
      fontFamily="sans-serif"
    >
      C
    </text>
  ),
  plus: <path d="M12 5 v14 M5 12 h14" stroke={S} strokeWidth="2.6" strokeLinecap="round" />,
  minus: <path d="M5 12 h14" stroke={S} strokeWidth="2.6" strokeLinecap="round" />,
  timer: (
    <>
      <circle cx="12" cy="13" r="8" fill="none" stroke={S} strokeWidth="2" />
      <path
        d="M12 8 v5 l4 2"
        fill="none"
        stroke={S}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  settings: (
    <path
      d="M16 6 a4 4 0 0 0 -5 5 L5 17 l2 2 6 -6 a4 4 0 0 0 5 -5 l-3 3 -2 -2 z"
      fill="none"
      stroke={S}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  ),
  info: (
    <>
      <circle cx="12" cy="6.5" r="1.6" fill={S} />
      <path d="M12 11 v9" stroke={S} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  lockOn: (
    <>
      <rect x="6" y="11" width="12" height="9" rx="1.5" fill="none" stroke={S} strokeWidth="2" />
      <path d="M8.5 11 V8 a3.5 3.5 0 0 1 7 0 v3" fill="none" stroke={S} strokeWidth="2" />
    </>
  ),
  lockOff: (
    <>
      <rect x="6" y="11" width="12" height="9" rx="1.5" fill="none" stroke={S} strokeWidth="2" />
      <path
        d="M8.5 11 V8 a3.5 3.5 0 0 1 7 -1.5"
        fill="none"
        stroke={S}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
  pause: <path d="M9 6 v12 M15 6 v12" stroke={S} strokeWidth="2.6" strokeLinecap="round" />,
  play: <path d="M9 6 l9 6 -9 6 z" fill={S} />,
};

export function ButtonGlyph({ icon, className }: { icon: ButtonIcon; className?: string }) {
  if (icon === 'none') return null;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {paths[icon]}
    </svg>
  );
}
