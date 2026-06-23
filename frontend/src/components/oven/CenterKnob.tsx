import { useLayoutEffect, useRef } from 'react';

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
// Visible detent scale: evenly-spaced rest positions across the dial's sweep.
// The value sweeps -135°..+135° (see knobAngle), so the markers do too, and on
// release the tick eases to whichever marker it's closest to — landing exactly
// on it, so the white tick covers the black rim mark beneath it.
const SWEEP_MIN = -135;
const SWEEP_MAX = 135;
const DETENTS = 11; // marks across the sweep (inclusive of both ends)
const DETENT_ANGLES = Array.from(
  { length: DETENTS },
  (_, i) => SWEEP_MIN + (i * (SWEEP_MAX - SWEEP_MIN)) / (DETENTS - 1)
);

// Nearest detent angle to an arbitrary rotation. The tick's live rotation can
// wind past ±180° over a long drag, so fold it back into the sweep's frame
// before matching.
const snapAngle = (deg: number) => {
  let a = ((deg + 180) % 360) - 180; // normalise to (-180, 180]
  if (a < -180) a += 360;
  a = Math.max(SWEEP_MIN, Math.min(SWEEP_MAX, a)); // clamp into the sweep
  return DETENT_ANGLES.reduce((best, d) =>
    Math.abs(d - a) < Math.abs(best - a) ? d : best
  );
};

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

  // Seed the tick to the value's angle ONCE on mount. After that the tick is
  // driven purely imperatively (by `move`, then frozen on release) so it stays
  // where the user drops it — we never re-bind it to `angle` on later renders,
  // which is what used to snap it back to the value's detent.
  useLayoutEffect(() => {
    const start = snapAngle(angle);
    if (tickRef.current) tickRef.current.style.transform = `rotate(${start}deg)`;
    drag.current.live = start;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // Resume from where the tick was last left, not the value's angle — the
      // dial is relative, so a new grab continues from the visible mark.
      live: drag.current.live,
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

  const settle = () => {
    const d = drag.current;
    // Snap the tick to the nearest detent and ease into it (transition on).
    // The value was already banked from the drag deltas during move(); this is
    // purely the visual settle, so the white tick comes to rest exactly over a
    // black rim marker. Store it back so the next grab resumes from the marker.
    const snapped = snapAngle(d.live);
    d.live = snapped;
    if (tickRef.current) {
      tickRef.current.style.transition = '';
      tickRef.current.style.transform = `rotate(${snapped}deg)`;
    }
  };

  const end = () => {
    const d = drag.current;
    if (d.active && d.moved < TAP_SLOP) onPress();
    d.active = false;
    settle();
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
          settle();
        }}
        onWheel={(e) => onStep(e.deltaY > 0 ? 1 : -1)}
      >
        {/* black detent markers on the rim — the rest positions. Each is drawn
            identically to the white tick (same radius/length/width) but rotated
            to its detent angle, so the tick lands exactly over one when snapped. */}
        {DETENT_ANGLES.map((d) => (
          <div
            key={d}
            className="pointer-events-none absolute inset-0"
            style={{ transform: `rotate(${d}deg)`, transformOrigin: '50% 50%' }}
          >
            <span className="absolute left-1/2 top-[3%] h-[13%] w-0.75 -translate-x-1/2 rounded-full bg-black/30" />
          </div>
        ))}

        {/* orbiting position tick on the bezel. The transform is owned entirely
            by the drag handlers (seeded once on mount, snapped on release); it is
            intentionally NOT bound to `angle`. */}
        <div
          ref={tickRef}
          className="pointer-events-none absolute inset-0 transition-transform duration-150"
          style={{ transformOrigin: '50% 50%' }}
        >
          <span className="absolute left-1/2 top-[3%] h-[13%] w-0.75 -translate-x-1/2 rounded-full bg-white/80 shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
        </div>

        {/* dark glossy well */}
        <div className="knob-well pointer-events-none absolute inset-[22%] flex items-center justify-center rounded-full">
          {inner && (
            <span className="text-lcd-ink/55 seg text-[clamp(18px,4.4vh,30px)]">{inner}</span>
          )}
        </div>
      </div>
    </div>
  );
}
