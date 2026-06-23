import { useRef } from 'react';

interface Props {
  /** Pointer angle in degrees (0 = top), reflecting the current value. */
  angle: number;
  /** Called once per detent the user turns the dial. dir +1 = clockwise. */
  onStep: (dir: 1 | -1) => void;
  /** Centre push — confirm / wake. */
  onPress: () => void;
  /** Small text shown inside the glossy well (e.g. "5/7"). */
  inner?: React.ReactNode;
}

// Degrees of rotation that make up one detent ("click") of the dial.
const STEP = 24;
// Drag distance (px) below which a release counts as a tap, not a turn.
const TAP_SLOP = 6;

// The single large chrome rotary from the reference photos. It sits low and
// centred, half-sunk into the bottom edge of the glass. You grab it and turn:
// angular drag accumulates into discrete detents (like a real rotary encoder),
// firing onStep each time. A short tap with no turn pushes it (onPress). Mouse,
// touch and scroll-wheel all drive it.
export default function CenterKnob({ angle, onStep, onPress, inner }: Props) {
  const ringRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<HTMLDivElement>(null);
  const drag = useRef({
    active: false,
    last: 0, // last pointer angle (deg)
    live: 0, // visual rotation that tracks the finger 1:1
    accum: 0, // rotation banked toward the next detent
    moved: 0, // total absolute rotation, to tell a turn from a tap
  });

  // Pointer angle relative to the dial centre.
  const pointerAngle = (clientX: number, clientY: number) => {
    const el = ringRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return (
      (Math.atan2(clientY - (r.top + r.height / 2), clientX - (r.left + r.width / 2)) * 180) /
      Math.PI
    );
  };

  const begin = (clientX: number, clientY: number) => {
    drag.current = {
      active: true,
      last: pointerAngle(clientX, clientY),
      live: angle, // start the live rotation where the value currently points
      accum: 0,
      moved: 0,
    };
    // Drop the settle transition so the ring follows the finger with no lag.
    if (tickRef.current) tickRef.current.style.transition = 'none';
  };

  const move = (clientX: number, clientY: number) => {
    const d = drag.current;
    if (!d.active) return;
    const a = pointerAngle(clientX, clientY);
    let delta = a - d.last;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    d.last = a;
    d.accum += delta;
    d.moved += Math.abs(delta);

    // Track the finger exactly: rotate the tick by the raw drag, imperatively
    // (no React render, no transition) so it stays under the finger.
    d.live += delta;
    if (tickRef.current) tickRef.current.style.transform = `rotate(${d.live}deg)`;

    while (Math.abs(d.accum) >= STEP) {
      const dir = d.accum > 0 ? 1 : -1;
      d.accum -= dir * STEP;
      onStep(dir);
    }
  };

  const end = () => {
    const d = drag.current;
    if (d.active && d.moved < TAP_SLOP) onPress();
    d.active = false;
    // Hand control back to the value-driven angle, easing into its detent.
    // Set it explicitly (not '') so it's correct even when the last drag was
    // under one detent and triggered no re-render.
    if (tickRef.current) {
      tickRef.current.style.transition = '';
      tickRef.current.style.transform = `rotate(${angle}deg)`;
    }
  };

  return (
    <div className="relative aspect-square h-full select-none">
      <div
        ref={ringRef}
        className="knob-ring absolute inset-0 cursor-grab touch-none rounded-full active:cursor-grabbing"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          begin(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => move(e.clientX, e.clientY)}
        onPointerUp={end}
        onPointerCancel={() => {
          drag.current.active = false;
          if (tickRef.current) {
            tickRef.current.style.transition = '';
            tickRef.current.style.transform = `rotate(${angle}deg)`;
          }
        }}
        onWheel={(e) => onStep(e.deltaY > 0 ? 1 : -1)}
      >
        {/* orbiting position tick on the bezel. While idle it follows `angle`
            (the value) with a soft settle; during a drag `move` overrides the
            transform imperatively so it tracks the finger 1:1. */}
        <div
          ref={tickRef}
          className="pointer-events-none absolute inset-0 transition-transform duration-150"
          style={{ transform: `rotate(${angle}deg)`, transformOrigin: '50% 50%' }}
        >
          <span className="absolute left-1/2 top-[3%] h-[7%] w-0.5 -translate-x-1/2 rounded-full bg-white/80 shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
        </div>

        {/* dark glossy well */}
        <div className="knob-well pointer-events-none absolute inset-[22%] flex items-center justify-center rounded-full">
          {inner && (
            <span className="text-lcd-ink/55 seg text-[clamp(10px,2.4vh,16px)]">{inner}</span>
          )}
        </div>
      </div>
    </div>
  );
}
