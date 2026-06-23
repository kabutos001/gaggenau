import type { Translations } from './types';

// German catalogue — the original strings, preserved for a future toggle.
export const de: Translations = {
  modes: {
    hotair: {
      label: 'Heißluft',
      use: 'Für Kuchen, Plätzchen und Blätterteig auf mehreren Ebenen.',
    },
    eco: {
      label: 'Eco',
      use: 'Energiesparender Heißluftbetrieb für Kuchen, Aufläufe und Gratins.',
    },
    'hotair-bottom': {
      label: 'Heißluft + Unterhitze',
      use: 'Zusätzliche Hitze von unten für feuchte Kuchen, z. B. Obstkuchen.',
    },
    bottom: {
      label: 'Unterhitze',
      use: 'Zum Nachbacken, Einkochen, für Gerichte im Wasserbad.',
    },
    'top-bottom': {
      label: 'Ober- und Unterhitze',
      use: 'Für Kuchen in Formen oder auf dem Blech, Aufläufe, Braten.',
    },
    top: {
      label: 'Oberhitze',
      use: 'Gezielte Hitze von oben, z. B. Überbacken von Obstkuchen mit Baiser.',
    },
    'grill-hotair': {
      label: 'Grill + Heißluft',
      use: 'Gleichmäßige Rundum-Erwärmung für Fleisch, Geflügel und ganzen Fisch.',
    },
    grill: {
      label: 'Grill',
      use: 'Flache Fleischstücke, Würstchen oder Fischfilet grillen, Gratinieren.',
    },
    pizza: {
      label: 'Backstein-Funktion',
      use: 'Beheizbarer Backstein für knusprige Pizza und Brot.',
    },
    catalysis: {
      label: 'Katalyse',
      use: 'Katalytische Selbstreinigung.',
    },
  },
  timerFunctions: {
    minuteMinder: 'Kurzzeit-Wecker',
    stopwatch: 'Stoppuhr',
    cookDuration: 'Garzeit-Dauer',
    cookEnd: 'Garzeit-Ende',
  },
  settingFunctions: {
    clock: 'Uhrzeit',
    timeFormat: 'Zeitformat',
    tempUnit: 'Temperatureinheit',
    childLock: 'Kindersicherung',
    demo: 'Demo-Modus',
  },
  screen: {
    childLockActive: 'Kindersicherung aktiv',
    unlock: 'Entsperren',
    currentTemperature: 'Aktuelle Temperatur',
    stopwatchRunning: 'Stoppuhr · läuft',
    start: 'Start',
  },
  assistant: {
    micButtonAria: 'Was kochst du? — Mikrofon starten',
    cancelRecordingAria: 'Aufnahme abbrechen',
    speakingAria: 'spricht',
    recordingPrompt: 'Was kochst du heute?',
    done: 'Fertig',
    thinking: 'Suche das passende Programm…',
    speaking: 'Sous-Chef spricht …',
    discard: 'Verwerfen',
    apply: 'Übernehmen',
    cancel: 'Abbrechen',
    askAgain: 'Erneut fragen',
    inputPlaceholder: 'z. B. Obstkuchen für heute Abend',
    micUnavailable: 'Mikrofon nicht verfügbar — tippe deinen Wunsch ein.',
    genericError: 'Etwas ist schiefgelaufen.',
  },
};
