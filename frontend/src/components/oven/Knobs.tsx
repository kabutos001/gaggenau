import { MODES, TEMP_MAX, TEMP_MIN, TEMP_STEP } from './constants';
import ModeGlyph from './glyphs/ModeGlyph';
import type { Action, OvenState } from './types';

interface Props {
  state: OvenState;
  dispatch: (a: Action) => void;
}

// Maps the oven temp range onto a dial sweep (about -135°..+135°).
function tempAngle(temp: number) {
  if (temp === 0) return -150;
  const frac = (temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN);
  return -135 + frac * 270;
}

function Knob({
  angle,
  label,
  onLeft,
  onRight,
  children,
}: {
  angle: number;
  label: string;
  onLeft: () => void;
  onRight: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        {/* tap halves: left = counter-clockwise, right = clockwise */}
        <button
          type="button"
          aria-label={`${label} verringern`}
          onClick={onLeft}
          className="absolute left-0 top-0 z-10 h-full w-1/2 rounded-l-full"
        />
        <button
          type="button"
          aria-label={`${label} erhöhen`}
          onClick={onRight}
          className="absolute right-0 top-0 z-10 h-full w-1/2 rounded-r-full"
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 38% 30%, #6b7077, #2c3137 70%, #1c2025)',
            boxShadow:
              '0 6px 14px rgba(0,0,0,0.5), inset 0 2px 3px rgba(255,255,255,0.25), inset 0 -6px 12px rgba(0,0,0,0.5)',
          }}
        >
          {/* pointer notch — a full-size layer rotated about the dial centre,
              with a tick pinned to its top edge so it orbits the rim. */}
          <div
            className="absolute inset-0"
            style={{ transform: `rotate(${angle}deg)`, transformOrigin: '50% 50%' }}
          >
            <span className="absolute left-1/2 top-1.5 h-3.5 w-0.75 -translate-x-1/2 rounded-full bg-lcd-ink" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">{children}</div>
        </div>
      </div>
      <span className="text-[11px] uppercase tracking-widest text-neutral-400">{label}</span>
    </div>
  );
}

export default function Knobs({ state, dispatch }: Props) {
  const mode = MODES[state.modeIndex];

  // Function (left) knob — cycles operating mode. Turning it on from off
  // starts the oven at the mode's default temperature.
  const cycleMode = (dir: 1 | -1) => {
    if (!state.on) {
      dispatch({ type: 'SET_TEMP', value: mode.temp });
      return;
    }
    dispatch({ type: 'CYCLE_MODE', dir });
  };

  // Temperature (right) knob.
  const adjustTemp = (dir: 1 | -1) => {
    if (dir === -1 && state.temp <= TEMP_MIN) {
      dispatch({ type: 'TEMP_OFF' });
      return;
    }
    const next = state.temp === 0 ? mode.temp : state.temp + dir * TEMP_STEP;
    dispatch({ type: 'SET_TEMP', value: next });
  };

  return (
    <div className="flex items-start justify-center gap-16">
      <Knob
        angle={state.on ? -135 + (state.modeIndex / (MODES.length - 1)) * 270 : -150}
        label="Funktion"
        onLeft={() => cycleMode(-1)}
        onRight={() => cycleMode(1)}
      >
        <ModeGlyph mode={mode.id} className="h-8 w-8 text-lcd-ink/70" />
      </Knob>

      <Knob
        angle={tempAngle(state.temp)}
        label="Temperatur"
        onLeft={() => adjustTemp(-1)}
        onRight={() => adjustTemp(1)}
      >
        <span className="text-[10px] font-semibold tracking-wider text-lcd-ink/70">
          {state.temp === 0 ? 'AUS' : `${state.temp}°`}
        </span>
      </Knob>
    </div>
  );
}
