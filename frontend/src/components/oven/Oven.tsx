import { useEffect, useReducer } from 'react';

import AssistantOverlay from './assistant/AssistantOverlay';
import { useAssistant } from './assistant/useAssistant';
import { INITIAL_STATE } from './constants';
import Fascia from './Fascia';
import { ovenReducer } from './reducer';

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
    <div className="flex min-h-dvh w-full items-center justify-center bg-black p-[1.5vh]">
      <div className="relative w-full">
        <Fascia
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

        {/* Assistant trigger — the headline feature. Floats over the glass,
            tucked into a corner so it reads as part of the appliance UI. */}
        {!assistantActive && (
          <button
            type="button"
            onClick={() => assistant.open()}
            className="bg-lcd-heat absolute bottom-[8%] right-[5%] z-20 flex items-center gap-[1vh] rounded-full px-[2vh] py-[1.2vh] text-[clamp(10px,1.8vh,14px)] font-medium text-white shadow-lg transition active:scale-95"
          >
            <MicIcon className="h-[2.2vh] w-[2.2vh]" />
            Was kochst du?
          </button>
        )}
      </div>
    </div>
  );
}
