import type { OvenMode, OvenState, TimerFn, SettingFn } from './types';

// Operating modes in the order the function knob cycles them (manual p9).
// Top position is Heißluft (hot air).
export const MODES: OvenMode[] = [
  { id: 'hotair', label: 'Heißluft', use: 'Für Kuchen, Plätzchen und Blätterteig auf mehreren Ebenen.', temp: 165 },
  { id: 'eco', label: 'Eco', use: 'Energiesparender Heißluftbetrieb für Kuchen, Aufläufe und Gratins.', temp: 165 },
  {
    id: 'hotair-bottom',
    label: 'Heißluft + Unterhitze',
    use: 'Zusätzliche Hitze von unten für feuchte Kuchen, z. B. Obstkuchen.',
    temp: 165,
  },
  { id: 'bottom', label: 'Unterhitze', use: 'Zum Nachbacken, Einkochen, für Gerichte im Wasserbad.', temp: 170 },
  { id: 'top-bottom', label: 'Ober- und Unterhitze', use: 'Für Kuchen in Formen oder auf dem Blech, Aufläufe, Braten.', temp: 170 },
  { id: 'top', label: 'Oberhitze', use: 'Gezielte Hitze von oben, z. B. Überbacken von Obstkuchen mit Baiser.', temp: 170 },
  { id: 'grill-hotair', label: 'Grill + Heißluft', use: 'Gleichmäßige Rundum-Erwärmung für Fleisch, Geflügel und ganzen Fisch.', temp: 190 },
  { id: 'grill', label: 'Grill', use: 'Flache Fleischstücke, Würstchen oder Fischfilet grillen, Gratinieren.', temp: 200 },
  { id: 'pizza', label: 'Backstein-Funktion', use: 'Beheizbarer Backstein für knusprige Pizza und Brot.', temp: 300, special: true },
  { id: 'catalysis', label: 'Katalyse', use: 'Katalytische Selbstreinigung.', temp: 300, special: true },
];

export const TEMP_MIN = 50;
export const TEMP_MAX = 300;
export const TEMP_STEP = 5;

export const TIMER_FUNCTIONS: { id: TimerFn; label: string; standbyOnly: boolean }[] = [
  { id: 'minuteMinder', label: 'Kurzzeit-Wecker', standbyOnly: false },
  { id: 'stopwatch', label: 'Stoppuhr', standbyOnly: false },
  { id: 'cookDuration', label: 'Garzeit-Dauer', standbyOnly: true }, // not in stand-by
  { id: 'cookEnd', label: 'Garzeit-Ende', standbyOnly: true },
];

export const SETTING_FUNCTIONS: { id: SettingFn; label: string }[] = [
  { id: 'clock', label: 'Uhrzeit' },
  { id: 'timeFormat', label: 'Zeitformat' },
  { id: 'tempUnit', label: 'Temperatureinheit' },
  { id: 'childLock', label: 'Kindersicherung' },
  { id: 'demo', label: 'Demo-Modus' },
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
