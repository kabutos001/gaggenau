import CenterKnob from './CenterKnob';
import { MODES, TEMP_MIN, TEMP_STEP } from './constants';
import ScreenContent from './screens/ScreenContent';
import type { Action, OvenState } from './types';
import { knobAngle, knobInner } from './utils';

interface Props {
  state: OvenState;
  dispatch: (a: Action) => void;
  /** Rendered on top of the glass (e.g. the assistant overlay). */
  overlay?: React.ReactNode;
}

// The whole oven fascia, laid out landscape to fill the (sideways) phone:
// a brushed-steel surround framing a wide black-glass display, with one large
// chrome rotary sunk low and centred — exactly the reference product.
export default function Fascia({ state, dispatch, overlay }: Props) {
  const mode = MODES[state.modeIndex];

  // The single knob is context-sensitive. Turning it (one detent at a time)
  // adjusts the primary value of the current screen; pressing it confirms /
  // changes the secondary axis.
  const step = (dir: 1 | -1) => {
    switch (state.screen) {
      case 'standby':
        // Turning the cold knob lights the oven at the mode's default temp.
        if (dir === 1) dispatch({ type: 'SET_TEMP', value: mode.temp });
        break;
      case 'operating': {
        if (dir === -1 && state.temp <= TEMP_MIN) {
          dispatch({ type: 'TEMP_OFF' });
          break;
        }
        const next = state.temp === 0 ? mode.temp : state.temp + dir * TEMP_STEP;
        dispatch({ type: 'SET_TEMP', value: next });
        break;
      }
      case 'timer':
        dispatch({ type: 'TIMER_ADJUST', dir });
        break;
      case 'settings':
      case 'firstSettings':
        dispatch({ type: 'SETTINGS_ADJUST', dir });
        break;
      default:
        break;
    }
  };

  const press = () => {
    switch (state.screen) {
      case 'standby':
        dispatch({ type: 'ACTIVATE' });
        break;
      case 'operating':
        // Push to change the heating mode (Funktion).
        dispatch({ type: 'CYCLE_MODE', dir: 1 });
        break;
      case 'timer':
        if (mode && state.timerIndex === 1) dispatch({ type: 'STOPWATCH_TOGGLE' });
        else dispatch({ type: 'BACK' });
        break;
      default:
        dispatch({ type: 'BACK' });
        break;
    }
  };

  return (
    <div
      className="brushed-steel relative flex aspect-16/7 w-full max-w-[min(100vw,177vh)] items-center justify-center overflow-hidden rounded-[14px] p-[1.6vh] shadow-[0_24px_60px_rgba(0,0,0,0.7)]"
    >
      {/* the black glass panel */}
      <div
        className="relative h-full w-full overflow-hidden rounded-lg"
        style={{
          background:
            'radial-gradient(140% 120% at 50% -10%, #1a1d20 0%, var(--color-lcd-glass) 40%, var(--color-lcd-glass-2) 100%)',
          boxShadow:
            'inset 0 1px 2px rgba(255,255,255,0.06), inset 0 -16px 40px rgba(0,0,0,0.7)',
        }}
      >
        <ScreenContent state={state} dispatch={dispatch} />

        {/* the big rotary — sunk into the bottom edge, horizontally centred */}
        <div className="absolute bottom-[-14%] left-1/2 z-10 h-[78%] -translate-x-1/2">
          <CenterKnob
            angle={knobAngle(state)}
            inner={knobInner(state)}
            onStep={step}
            onPress={press}
          />
        </div>

        {/* glass glare */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(155deg, rgba(255,255,255,0.045), transparent 38%)',
          }}
        />

        {overlay}
      </div>
    </div>
  );
}
