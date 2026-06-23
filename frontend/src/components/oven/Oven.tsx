import { useEffect, useReducer } from 'react';

import AssistantOverlay from './assistant/AssistantOverlay';
import { useAssistant } from './assistant/useAssistant';
import { INITIAL_STATE } from './constants';
import DisplayPanel from './DisplayPanel';
import Knobs from './Knobs';
import { ovenReducer } from './reducer';
import type { Action, OvenState } from './types';

// Child-lock + standby helper buttons live below the fascia so the demo is
// fully clickable on a phone without the two physical rotary gestures.
function Tray({ state, dispatch }: { state: OvenState; dispatch: (a: Action) => void }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <TrayBtn onClick={() => dispatch({ type: 'TEMP_OFF' })}>Aus / Stand-by</TrayBtn>
      <TrayBtn
        onClick={() => dispatch({ type: 'TOGGLE_LOCK' })}
        disabled={!state.childLockAvailable}
      >
        {state.screen === 'locked' ? 'Entsperren' : 'Kindersicherung'}
      </TrayBtn>
    </div>
  );
}

function TrayBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-neutral-700 px-4 py-1.5 text-xs text-neutral-300 transition active:scale-95 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Oven() {
  const [state, dispatch] = useReducer(ovenReducer, INITIAL_STATE);
  const assistant = useAssistant();

  // 1-second simulation tick: ramps cavity temp, runs the stopwatch.
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, []);

  const assistantActive = assistant.state.phase !== 'idle';

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-950 px-4 py-8">
      {/* brushed-steel control fascia (manual p7) */}
      <div
        className="w-full max-w-md rounded-2xl p-5 pb-7"
        style={{
          background: 'linear-gradient(180deg, #d9dde1 0%, #b8bdc2 38%, #cfd4d8 100%)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.7)',
        }}
      >
        <div className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.4em] text-neutral-600">
          Gaggenau
        </div>

        <DisplayPanel
          state={state}
          dispatch={dispatch}
          overlay={
            assistantActive ? (
              <AssistantOverlay
                state={assistant.state}
                celsius={state.celsius}
                onStartRecording={assistant.startRecording}
                onStopAndAsk={assistant.stopAndAsk}
                onAskText={assistant.askText}
                onConfirm={(modeId, temp) => {
                  dispatch({ type: 'APPLY_PROGRAM', modeId, temp });
                  assistant.reset();
                }}
                onDismiss={assistant.reset}
              />
            ) : undefined
          }
        />

        <div className="mt-6">
          <Knobs state={state} dispatch={dispatch} />
        </div>
      </div>

      {/* Assistant trigger — the headline feature. Tap to tell the oven what
          you're cooking; it suggests the program and you confirm. */}
      <button
        type="button"
        onClick={() => !assistantActive && assistant.open()}
        disabled={assistantActive}
        className="mt-6 flex items-center gap-2.5 rounded-full bg-lcd-heat px-6 py-3 text-sm font-medium text-white shadow-lg transition active:scale-95 disabled:opacity-40"
      >
        <MicIcon className="h-5 w-5" />
        Was kochst du?
      </button>

      <Tray state={state} dispatch={dispatch} />

      <p className="mt-6 max-w-md text-center text-[11px] leading-relaxed text-neutral-600">
        Tippe „Was kochst du?“ und sag, was es heute gibt — der Ofen schlägt das passende Programm
        vor und du bestätigst. Oder bediene ihn klassisch: Display antippen, Wähler drehen,
        Tasten für Timer- und Einstellungsmenü.
      </p>
    </div>
  );
}
