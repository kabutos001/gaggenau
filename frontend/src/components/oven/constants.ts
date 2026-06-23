import type { OvenMode, OvenState, TimerFn, SettingFn } from './types';

// Operating modes in the order the function knob cycles them (manual p9).
// Top position is hot air. Labels/usage text come from the i18n catalogue,
// keyed by id — only structural data lives here.
export const MODES: OvenMode[] = [
  { id: 'hotair', temp: 165 },
  { id: 'eco', temp: 165 },
  { id: 'hotair-bottom', temp: 165 },
  { id: 'bottom', temp: 170 },
  { id: 'top-bottom', temp: 170 },
  { id: 'top', temp: 170 },
  { id: 'grill-hotair', temp: 190 },
  { id: 'grill', temp: 200 },
  { id: 'pizza', temp: 300, special: true },
  { id: 'catalysis', temp: 300, special: true },
];

export const TEMP_MIN = 50;
export const TEMP_MAX = 300;
export const TEMP_STEP = 5;

// Labels come from the i18n catalogue (keyed by id); only structural data here.
export const TIMER_FUNCTIONS: { id: TimerFn; standbyOnly: boolean }[] = [
  { id: 'minuteMinder', standbyOnly: false },
  { id: 'stopwatch', standbyOnly: false },
  { id: 'cookDuration', standbyOnly: true }, // not in stand-by
  { id: 'cookEnd', standbyOnly: true },
];

export const SETTING_FUNCTIONS: { id: SettingFn }[] = [
  { id: 'clock' },
  { id: 'timeFormat' },
  { id: 'tempUnit' },
  { id: 'childLock' },
  { id: 'demo' },
];

export const INITIAL_STATE: OvenState = {
  screen: 'standby',
  temp: 0,
  modeIndex: 4, // Ober- und Unterhitze, matching the reference photo glyph
  on: false,
  heating: false,
  currentTemp: 20,
  clock: '11:30',
  use24h: true,
  celsius: true,
  childLockAvailable: true,
  timerIndex: 0,
  minuteMinder: 25,
  stopwatch: 0,
  stopwatchRunning: false,
  cookDuration: 80,
  settingIndex: 0,
};
