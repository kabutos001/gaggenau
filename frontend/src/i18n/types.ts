import type { ModeId, SettingFn, TimerFn } from '../components/oven/types';

// Supported UI locales. English is the product default; German is kept so a
// language toggle can be wired up later without re-extracting strings.
export type Locale = 'en' | 'de';

// Per-mode translatable text. Structural data (temp, special) stays in
// constants.ts — only the human-readable strings live here.
export interface ModeText {
  /** Operating-mode name as shown on the display. */
  label: string;
  /** Short usage description (manual p9). */
  use: string;
}

// The full translatable string catalogue for one locale.
export interface Translations {
  /** Operating-mode labels + usage text, keyed by mode id. */
  modes: Record<ModeId, ModeText>;
  /** Timer sub-function labels, keyed by timer-function id. */
  timerFunctions: Record<TimerFn, string>;
  /** Base-settings sub-function labels, keyed by setting-function id. */
  settingFunctions: Record<SettingFn, string>;
  /** On-screen captions and status text rendered by the oven display. */
  screen: {
    childLockActive: string;
    unlock: string;
    currentTemperature: string;
    stopwatchRunning: string;
    start: string;
  };
  /** Strings used by the voice/text assistant overlay. */
  assistant: {
    micButtonAria: string;
    cancelRecordingAria: string;
    speakingAria: string;
    recordingPrompt: string;
    done: string;
    thinking: string;
    speaking: string;
    discard: string;
    apply: string;
    cancel: string;
    askAgain: string;
    inputPlaceholder: string;
    micUnavailable: string;
    genericError: string;
  };
}
