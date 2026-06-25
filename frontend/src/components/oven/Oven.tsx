import { useEffect, useReducer } from 'react';

import { useTranslations } from '../../i18n/context';
import AssistantOverlay from './assistant/AssistantOverlay';
import { useAssistant } from './assistant/useAssistant';
import { INITIAL_STATE } from './constants';
import Fascia from './Fascia';
import { ovenReducer } from './reducer';

// Solid microphone glyph, matching the Siemens reference mic button.
function MicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
      <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V19H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.07A7 7 0 0 0 19 10Z" />
    </svg>
  );
}

export default function Oven() {
  const [state, dispatch] = useReducer(ovenReducer, INITIAL_STATE);
  const assistant = useAssistant();
  const t = useTranslations();

  // 1-second simulation tick: ramps cavity temp, runs the stopwatch.
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, []);

  const assistantActive = assistant.state.phase !== 'idle';

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-black">
      <div className="relative h-full w-full">
        <Fascia
          state={state}
          dispatch={dispatch}
          overlay={
            assistantActive ? (
              <AssistantOverlay
                state={assistant.state}
                celsius={state.celsius}
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

        {/* Assistant trigger — the headline feature. A hot mic: one tap starts
            recording immediately (no intermediate "Sprechen" step). Styled as
            the red microphone from the Siemens reference, with pulsing rings.
            Now owns the bottom-right corner outright (the timer control moved
            to the bottom-left), so it sits centred in that corner. */}
        {!assistantActive && (
          <div className="absolute right-[6%] bottom-[6%] z-20 flex items-center justify-center">
            <span className="pointer-events-none absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-20" />
            <button
              type="button"
              onClick={() => assistant.startRecording()}
              aria-label={t.assistant.micButtonAria}
              className="relative z-10 flex h-[17vh] w-[17vh] items-center justify-center rounded-full bg-red-500 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_2px_10px_rgba(0,0,0,0.45)] transition hover:bg-red-600 active:scale-95"
            >
              <MicIcon className="h-[6.5vh] w-[6.5vh]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
