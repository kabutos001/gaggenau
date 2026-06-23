import type { ModeId } from '../types';

interface Props {
  mode: ModeId;
  className?: string;
}

// Heating-element glyphs as drawn on the Gaggenau LCD (manual p9).
// A glyph is built from up to three elements within a rounded frame:
//   top bar (Oberhitze), bottom bar (Unterhitze), fan (Heißluft).
// Grill = zig-zag top bar. Pizza = dotted bottom. Catalysis = brush mark.
const STROKE = 'currentColor';

function Bar({ y }: { y: number }) {
  return <line x1="7" y1={y} x2="29" y2={y} stroke={STROKE} strokeWidth="2.4" strokeLinecap="round" />;
}

function Fan() {
  // simple curved fan/propeller mark used for Heißluft
  return (
    <g stroke={STROKE} strokeWidth="2.2" fill="none" strokeLinecap="round">
      <path d="M18 18 C 13 14, 13 22, 18 18" />
      <path d="M18 18 C 23 14, 23 22, 18 18" />
      <circle cx="18" cy="18" r="1.4" fill={STROKE} stroke="none" />
    </g>
  );
}

function GrillBar({ y }: { y: number }) {
  return (
    <polyline
      points={`7,${y} 11,${y - 2.5} 15,${y} 19,${y - 2.5} 23,${y} 27,${y - 2.5} 29,${y}`}
      fill="none"
      stroke={STROKE}
      strokeWidth="2.2"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

function DottedBar({ y }: { y: number }) {
  return (
    <line
      x1="7"
      y1={y}
      x2="29"
      y2={y}
      stroke={STROKE}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeDasharray="2 3"
    />
  );
}

export default function ModeGlyph({ mode, className }: Props) {
  const content = () => {
    switch (mode) {
      case 'hotair':
        return (
          <>
            <Bar y={10} />
            <Fan />
          </>
        );
      case 'eco':
        return (
          <>
            <Bar y={10} />
            <g opacity={0.55}>
              <Fan />
            </g>
          </>
        );
      case 'hotair-bottom':
        return (
          <>
            <Bar y={9} />
            <Fan />
            <Bar y={27} />
          </>
        );
      case 'bottom':
        return <Bar y={26} />;
      case 'top-bottom':
        return (
          <>
            <Bar y={10} />
            <Bar y={26} />
          </>
        );
      case 'top':
        return <Bar y={10} />;
      case 'grill-hotair':
        return (
          <>
            <GrillBar y={11} />
            <Fan />
          </>
        );
      case 'grill':
        return <GrillBar y={12} />;
      case 'pizza':
        return (
          <>
            <Bar y={10} />
            <DottedBar y={27} />
          </>
        );
      case 'catalysis':
        return (
          <g stroke={STROKE} strokeWidth="2.2" fill="none" strokeLinecap="round">
            <path d="M9 24 L24 11" />
            <path d="M22 9 l4 4 -3 3 -4 -4 z" fill={STROKE} stroke="none" />
          </g>
        );
    }
  };

  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden>
      {content()}
    </svg>
  );
}
