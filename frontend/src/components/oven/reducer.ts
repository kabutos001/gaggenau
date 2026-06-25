import { MODES, TEMP_MAX, TEMP_MIN, TIMER_FUNCTIONS, SETTING_FUNCTIONS } from './constants';
import type { Action, OvenState } from './types';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function ovenReducer(state: OvenState, action: Action): OvenState {
  switch (action.type) {
    case 'ACTIVATE': {
      // Pressing the knob in stand-by lights the oven at the current mode's
      // default temperature — same lit state as turning the dial. Without
      // setting `on: true` here, a follow-up press could not cycle the mode
      // (CYCLE_MODE bails when the oven is off), so the program change only
      // worked after first turning the dial.
      if (state.screen !== 'standby') return state;
      const temp = clamp(MODES[state.modeIndex].temp, TEMP_MIN, TEMP_MAX);
      return { ...state, screen: 'operating', on: true, temp, heating: temp > state.currentTemp };
    }

    case 'SET_TEMP': {
      const temp = clamp(action.value, TEMP_MIN, TEMP_MAX);
      return {
        ...state,
        screen: 'operating',
        temp,
        on: true,
        heating: temp > state.currentTemp,
      };
    }

    case 'TEMP_OFF':
      // Turning the temperature knob to 0 switches the oven off → stand-by.
      return { ...state, screen: 'standby', on: false, heating: false, temp: 0, currentTemp: 20 };

    case 'CYCLE_MODE': {
      if (!state.on) return state;
      const modeIndex = (state.modeIndex + action.dir + MODES.length) % MODES.length;
      return { ...state, screen: 'operating', modeIndex };
    }

    case 'OPEN_TIMER':
      return { ...state, screen: 'timer', timerIndex: 0 };

    case 'OPEN_SETTINGS':
      return { ...state, screen: 'settings', settingIndex: 0 };

    case 'OPEN_INFO':
      return { ...state, screen: 'info' };

    case 'BACK':
      return { ...state, screen: state.on ? 'operating' : 'standby' };

    case 'TIMER_NAV': {
      // Skip functions unavailable in stand-by when the oven is off.
      const n = TIMER_FUNCTIONS.length;
      let i = state.timerIndex;
      for (let step = 0; step < n; step++) {
        i = (i + action.dir + n) % n;
        if (state.on || !TIMER_FUNCTIONS[i].standbyOnly) break;
      }
      return { ...state, timerIndex: i };
    }

    case 'TIMER_ADJUST': {
      const fn = TIMER_FUNCTIONS[state.timerIndex].id;
      if (fn === 'minuteMinder')
        return { ...state, minuteMinder: clamp(state.minuteMinder + action.dir, 0, 90) };
      if (fn === 'cookDuration')
        return { ...state, cookDuration: clamp(state.cookDuration + action.dir * 5, 0, 1439) };
      return state;
    }

    case 'TIMER_CLEAR': {
      const fn = TIMER_FUNCTIONS[state.timerIndex].id;
      if (fn === 'minuteMinder') return { ...state, minuteMinder: 0 };
      if (fn === 'stopwatch') return { ...state, stopwatch: 0, stopwatchRunning: false };
      if (fn === 'cookDuration') return { ...state, cookDuration: 0 };
      return state;
    }

    case 'STOPWATCH_TOGGLE':
      return { ...state, stopwatchRunning: !state.stopwatchRunning };

    case 'SETTINGS_NAV': {
      const n = SETTING_FUNCTIONS.length;
      return { ...state, settingIndex: (state.settingIndex + action.dir + n) % n };
    }

    case 'SETTINGS_ADJUST': {
      const fn = SETTING_FUNCTIONS[state.settingIndex].id;
      if (fn === 'timeFormat') return { ...state, use24h: !state.use24h };
      if (fn === 'tempUnit') return { ...state, celsius: !state.celsius };
      if (fn === 'childLock') return { ...state, childLockAvailable: !state.childLockAvailable };
      return state;
    }

    case 'TOGGLE_LOCK': {
      if (!state.childLockAvailable) return state;
      if (state.screen === 'locked')
        return { ...state, screen: state.on ? 'operating' : 'standby' };
      return { ...state, screen: 'locked' };
    }

    case 'APPLY_PROGRAM': {
      const idx = MODES.findIndex((m) => m.id === action.modeId);
      const temp = clamp(action.temp, TEMP_MIN, TEMP_MAX);
      return {
        ...state,
        screen: 'operating',
        modeIndex: idx >= 0 ? idx : state.modeIndex,
        temp,
        on: true,
        heating: temp > state.currentTemp,
      };
    }

    case 'TICK': {
      let { currentTemp, heating, stopwatch } = state;
      if (state.on && currentTemp < state.temp) {
        currentTemp = Math.min(state.temp, currentTemp + 12);
        heating = currentTemp < state.temp;
      } else if (state.on) {
        heating = false;
      }
      if (state.stopwatchRunning) stopwatch = (stopwatch + 1) % (90 * 60);
      return { ...state, currentTemp, heating, stopwatch };
    }

    default:
      return state;
  }
}
