// Operating modes (Betriebsarten) — manual p9.
// `temp` is the default temperature the manual shows for each mode.
export type ModeId =
  | 'hotair'
  | 'eco'
  | 'hotair-bottom'
  | 'bottom'
  | 'top-bottom'
  | 'top'
  | 'grill-hotair'
  | 'grill'
  | 'pizza'
  | 'catalysis';

export interface OvenMode {
  id: ModeId;
  /** German label as printed in the manual. */
  label: string;
  /** Short usage description (manual p9). */
  use: string;
  /** Default temperature shown in the manual for this mode (°C). */
  temp: number;
  /** Whether this mode is a special-accessory mode. */
  special?: boolean;
}

// The four touch buttons flanking the display. Two per side (top + middle).
export type ButtonSlot = 'topLeft' | 'bottomLeft' | 'topRight' | 'bottomRight';

// Icons a button can currently carry (manual p7 button table).
export type ButtonIcon =
  | 'none'
  | 'left' // ‹  go left
  | 'right' // ›  go right
  | 'confirm' // ↵  accept / start
  | 'clear' // C  clear
  | 'plus' // +
  | 'minus' // −
  | 'timer' // clock — open timer menu
  | 'settings' // wrench — base settings
  | 'info' // i — show current cavity temp
  | 'lockOn' // activate child lock
  | 'lockOff' // release child lock
  | 'pause' // ‖  stopwatch pause
  | 'play'; // ▶  stopwatch start

export interface ButtonConfig {
  icon: ButtonIcon;
  action?: Action;
}

// Top-level screens / modes of the state machine.
export type Screen =
  | 'standby'
  | 'operating'
  | 'info' // current cavity temperature readout
  | 'timer'
  | 'settings'
  | 'locked'
  | 'firstSettings';

// Timer sub-functions (manual p19).
export type TimerFn = 'minuteMinder' | 'stopwatch' | 'cookDuration' | 'cookEnd';

// Base-settings sub-functions (manual p26).
export type SettingFn = 'clock' | 'timeFormat' | 'tempUnit' | 'childLock' | 'demo';

export interface OvenState {
  screen: Screen;
  /** Set temperature in °C (50–300), or 0 when oven is off. */
  temp: number;
  modeIndex: number;
  /** Whether the oven is actively heating (knob turned on). */
  on: boolean;
  /** Still ramping up to the set temperature → show heat-up arrows. */
  heating: boolean;
  /** Simulated current cavity temperature (°C). */
  currentTemp: number;
  clock: string; // "HH:MM"
  use24h: boolean;
  celsius: boolean;
  childLockAvailable: boolean;
  // Timer menu
  timerIndex: number;
  minuteMinder: number; // minutes 0–90
  stopwatch: number; // seconds
  stopwatchRunning: boolean;
  cookDuration: number; // minutes
  // Settings menu
  settingIndex: number;
}

export type Action =
  | { type: 'ACTIVATE' } // leave stand-by
  | { type: 'SET_TEMP'; value: number } // rotary temperature
  | { type: 'TEMP_OFF' } // turn temperature knob to 0
  | { type: 'CYCLE_MODE'; dir: 1 | -1 } // rotary function knob
  | { type: 'OPEN_TIMER' }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'OPEN_INFO' }
  | { type: 'BACK' } // confirm / return to operating readout
  | { type: 'TIMER_NAV'; dir: 1 | -1 }
  | { type: 'TIMER_ADJUST'; dir: 1 | -1 }
  | { type: 'TIMER_CLEAR' }
  | { type: 'STOPWATCH_TOGGLE' }
  | { type: 'SETTINGS_NAV'; dir: 1 | -1 }
  | { type: 'SETTINGS_ADJUST'; dir: 1 | -1 }
  | { type: 'TOGGLE_LOCK' }
  | { type: 'APPLY_PROGRAM'; modeId: ModeId; temp: number } // assistant suggestion
  | { type: 'TICK' }; // 1s simulation tick
