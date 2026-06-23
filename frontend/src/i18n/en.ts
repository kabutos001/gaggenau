import type { Translations } from './types';

// English catalogue — the product default.
export const en: Translations = {
  modes: {
    hotair: {
      label: 'Convection',
      use: 'For cakes, cookies and puff pastry on multiple levels.',
    },
    eco: {
      label: 'Eco',
      use: 'Energy-saving convection for cakes, casseroles and gratins.',
    },
    'hotair-bottom': {
      label: 'Convection + Bottom Heat',
      use: 'Extra heat from below for moist cakes, e.g. fruit cakes.',
    },
    bottom: {
      label: 'Bottom Heat',
      use: 'For re-baking, preserving and dishes in a water bath.',
    },
    'top-bottom': {
      label: 'Top and Bottom Heat',
      use: 'For cakes in tins or on a tray, casseroles and roasts.',
    },
    top: {
      label: 'Top Heat',
      use: 'Targeted heat from above, e.g. browning a fruit cake with meringue.',
    },
    'grill-hotair': {
      label: 'Grill + Convection',
      use: 'Even all-around heat for meat, poultry and whole fish.',
    },
    grill: {
      label: 'Grill',
      use: 'Grilling flat cuts of meat, sausages or fish fillet; gratinating.',
    },
    pizza: {
      label: 'Stone Bake',
      use: 'Heated baking stone for crispy pizza and bread.',
    },
    catalysis: {
      label: 'Catalysis',
      use: 'Catalytic self-cleaning.',
    },
  },
  timerFunctions: {
    minuteMinder: 'Minute Minder',
    stopwatch: 'Stopwatch',
    cookDuration: 'Cooking Duration',
    cookEnd: 'Cooking End',
  },
  settingFunctions: {
    clock: 'Time',
    timeFormat: 'Time Format',
    tempUnit: 'Temperature Unit',
    childLock: 'Child Lock',
    demo: 'Demo Mode',
  },
  screen: {
    childLockActive: 'Child lock active',
    unlock: 'Unlock',
    currentTemperature: 'Current temperature',
    stopwatchRunning: 'Stopwatch · running',
    start: 'Start',
  },
  assistant: {
    micButtonAria: 'What are you cooking? — start microphone',
    cancelRecordingAria: 'Cancel recording',
    speakingAria: 'speaking',
    recordingPrompt: 'What are you cooking today?',
    done: 'Done',
    thinking: 'Finding the right program…',
    speaking: 'Sous-Chef is speaking …',
    discard: 'Discard',
    apply: 'Apply',
    cancel: 'Cancel',
    askAgain: 'Ask again',
    inputPlaceholder: 'e.g. fruit cake for tonight',
    micUnavailable: 'Microphone unavailable — type your request instead.',
    genericError: 'Something went wrong.',
  },
};
