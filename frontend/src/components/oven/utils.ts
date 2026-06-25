import { MODES, SETTING_FUNCTIONS, TEMP_MAX, TEMP_MIN, TIMER_FUNCTIONS } from './constants';
import type { ButtonConfig, ButtonSlot, OvenState } from './types';

export function formatClock(state: OvenState): string {
  if (state.use24h) return state.clock;
  const [h, m] = state.clock.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Compute the cook-end clock time = now + duration (manual p22 Garzeit-Ende).
export function cookEndTime(state: OvenState): string {
  const [h, m] = state.clock.split(':').map(Number);
  const total = (h * 60 + m + state.cookDuration) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// The bezel tick angle (deg, 0 = top) reflecting the screen's primary value,
// swept across roughly -135°..+135° like a physical dial.
export function knobAngle(state: OvenState): number {
  const sweep = (frac: number) => -135 + Math.max(0, Math.min(1, frac)) * 270;
  switch (state.screen) {
    case 'operating':
      if (state.temp === 0) return -135;
      return sweep((state.temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN));
    case 'timer': {
      const fn = TIMER_FUNCTIONS[state.timerIndex].id;
      if (fn === 'minuteMinder') return sweep(state.minuteMinder / 90);
      if (fn === 'cookDuration') return sweep(state.cookDuration / 240);
      return -135;
    }
    case 'settings':
    case 'firstSettings':
      return sweep(state.settingIndex / (SETTING_FUNCTIONS.length - 1));
    default:
      return -135;
  }
}

// Small text shown inside the knob's glossy well. On the reference photos this
// is a step counter ("5/7"); here we surface a compact, screen-relevant token.
export function knobInner(state: OvenState): string | undefined {
  switch (state.screen) {
    case 'operating':
      return `${state.modeIndex + 1}/${MODES.length}`;
    case 'settings':
    case 'firstSettings':
      return `${state.settingIndex + 1}/${SETTING_FUNCTIONS.length}`;
    default:
      return undefined;
  }
}

// Map the current screen → which icon/action each of the four buttons carries.
// Mirrors the manual's per-screen button assignments.
export function buttonsFor(state: OvenState): Record<ButtonSlot, ButtonConfig> {
  const blank: ButtonConfig = { icon: 'none' };

  switch (state.screen) {
    case 'standby':
      return {
        topLeft: blank,
        bottomLeft: { icon: 'info', action: { type: 'OPEN_INFO' } },
        topRight: blank,
        bottomRight: { icon: 'timer', action: { type: 'OPEN_TIMER' } },
      };

    case 'operating':
      return {
        topLeft: blank,
        bottomLeft: { icon: 'info', action: { type: 'OPEN_INFO' } },
        topRight: { icon: 'settings', action: { type: 'OPEN_SETTINGS' } },
        bottomRight: { icon: 'timer', action: { type: 'OPEN_TIMER' } },
      };

    case 'info':
      return {
        topLeft: blank,
        bottomLeft: { icon: 'confirm', action: { type: 'BACK' } },
        topRight: blank,
        bottomRight: blank,
      };

    case 'timer': {
      // Function selection is done by tapping the menu strip; the four buttons
      // carry value controls + exit, so back is always reachable (manual p19).
      const fn = TIMER_FUNCTIONS[state.timerIndex].id;
      if (fn === 'stopwatch') {
        return {
          topLeft: blank,
          bottomLeft: { icon: 'confirm', action: { type: 'BACK' } },
          topRight: {
            icon: state.stopwatchRunning ? 'pause' : 'play',
            action: { type: 'STOPWATCH_TOGGLE' },
          },
          bottomRight: { icon: 'clear', action: { type: 'TIMER_CLEAR' } },
        };
      }
      return {
        topLeft: { icon: 'minus', action: { type: 'TIMER_ADJUST', dir: -1 } },
        bottomLeft: { icon: 'confirm', action: { type: 'BACK' } },
        topRight: { icon: 'plus', action: { type: 'TIMER_ADJUST', dir: 1 } },
        bottomRight: { icon: 'clear', action: { type: 'TIMER_CLEAR' } },
      };
    }

    case 'settings': {
      const fn = SETTING_FUNCTIONS[state.settingIndex].id;
      const adjustable = fn !== 'clock';
      return {
        topLeft: { icon: 'left', action: { type: 'SETTINGS_NAV', dir: -1 } },
        bottomLeft: { icon: 'confirm', action: { type: 'BACK' } },
        topRight: { icon: 'right', action: { type: 'SETTINGS_NAV', dir: 1 } },
        bottomRight: adjustable
          ? { icon: 'plus', action: { type: 'SETTINGS_ADJUST', dir: 1 } }
          : blank,
      };
    }

    case 'locked':
      return {
        topLeft: blank,
        bottomLeft: { icon: 'lockOff', action: { type: 'TOGGLE_LOCK' } },
        topRight: blank,
        bottomRight: blank,
      };

    case 'firstSettings':
      return {
        topLeft: { icon: 'left', action: { type: 'SETTINGS_NAV', dir: -1 } },
        bottomLeft: { icon: 'confirm', action: { type: 'BACK' } },
        topRight: { icon: 'right', action: { type: 'SETTINGS_NAV', dir: 1 } },
        bottomRight: { icon: 'plus', action: { type: 'SETTINGS_ADJUST', dir: 1 } },
      };
  }
}
