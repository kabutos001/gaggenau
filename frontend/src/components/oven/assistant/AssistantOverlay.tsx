import { useState } from 'react';

import { useTranslations } from '../../../i18n/context';
import ModeGlyph from '../glyphs/ModeGlyph';
import type { ModeId } from '../types';
import type { AssistantState } from './useAssistant';

interface Props {
  state: AssistantState;
  celsius: boolean;
  onStopAndAsk: () => void;
  onAskText: (t: string) => void;
  onConfirm: (modeId: ModeId, temp: number) => void;
  onDismiss: () => void;
}

const toDisp = (c: number, celsius: boolean) =>
  celsius ? c : Math.round((c * 9) / 5 + 32);

export default function AssistantOverlay({
  state,
  celsius,
  onStopAndAsk,
  onAskText,
  onConfirm,
  onDismiss,
}: Props) {
  const t = useTranslations();
  const [typed, setTyped] = useState('');

  const textForm = (submitLabel: string) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (typed.trim()) onAskText(typed.trim());
      }}
      className="flex w-full max-w-[92%] flex-col items-center gap-[1.6vh]"
    >
      <input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={t.assistant.inputPlaceholder}
        autoFocus
        className="text-lcd-ink placeholder:text-lcd-ink/30 w-full rounded-md border border-lcd-ink/25 bg-transparent px-[1.8vh] py-[1.2vh] text-[clamp(13px,2.2vh,18px)] outline-none focus:border-lcd-ink/60"
      />
      <div className="flex gap-[1.4vh]">
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-lcd-ink/30 px-[2.4vh] py-[1.1vh] text-[clamp(12px,2vh,16px)] text-lcd-ink/80"
        >
          {t.assistant.cancel}
        </button>
        <button
          type="submit"
          disabled={!typed.trim()}
          className="rounded-full bg-red-500 px-[3vh] py-[1.1vh] text-[clamp(12px,2vh,16px)] font-medium text-white hover:bg-red-600 active:scale-95 disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );

  return (
    <div className="text-lcd-ink absolute inset-0 z-20 flex flex-col items-center justify-center gap-[2vh] bg-[#1c2228]/95 px-5 text-center backdrop-blur-sm">
      {state.phase === 'recording' && (
        <>
          <Listening />
          <p className="text-[clamp(13px,2.2vh,18px)] text-lcd-ink/80">
            {t.assistant.recordingPrompt}
          </p>
          <div className="mt-[0.6vh] flex items-center gap-[1.4vh]">
            {/* Cancel — discards the recording client-side without sending it,
                for a misclicked mic. */}
            <button
              type="button"
              onClick={onDismiss}
              aria-label={t.assistant.cancelRecordingAria}
              className="flex h-[5vh] w-[5vh] items-center justify-center rounded-full border border-lcd-ink/30 text-lcd-ink/70 active:scale-95"
            >
              <XIcon className="h-[2.4vh] w-[2.4vh]" />
            </button>
            <button
              type="button"
              onClick={onStopAndAsk}
              className="rounded-full bg-red-500 px-[3vh] py-[1.1vh] text-[clamp(12px,2vh,16px)] font-medium text-white hover:bg-red-600 active:scale-95"
            >
              {t.assistant.done}
            </button>
          </div>
        </>
      )}

      {state.phase === 'thinking' && (
        <>
          <Spinner />
          <p className="text-[clamp(13px,2.2vh,18px)] text-lcd-ink/70">{t.assistant.thinking}</p>
        </>
      )}

      {state.phase === 'suggestion' && state.suggestion && (
        <>
          {state.suggestion.transcript && (
            <p className="max-w-[90%] text-[clamp(11px,1.8vh,15px)] text-lcd-ink/45 italic">
              „{state.suggestion.transcript}“
            </p>
          )}
          <div className="flex items-center gap-[1.6vh]">
            <ModeGlyph mode={state.suggestion.mode_id} className="text-lcd-ink h-[6vh] w-[6vh]" />
            <div className="text-left">
              <div className="text-[clamp(16px,3vh,24px)] leading-tight font-medium">
                {state.suggestion.mode_label}
              </div>
              <div className="text-lcd-ink/70 text-[clamp(13px,2.2vh,18px)]">
                {toDisp(state.suggestion.temp_c, celsius)}
                {celsius ? '°C' : '°F'}
              </div>
            </div>
            {state.speaking && <Speaking />}
          </div>
          {/* The Sous-Chef answer is spoken, not written — the user listens.
              While it speaks we show a calm hint instead of the reply text. */}
          {state.speaking && (
            <p className="text-lcd-ink/50 text-[clamp(11px,1.8vh,15px)] tracking-wide">
              {t.assistant.speaking}
            </p>
          )}
          <div className="mt-[0.6vh] flex gap-[1.4vh]">
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full border border-lcd-ink/30 px-[2.4vh] py-[1.1vh] text-[clamp(12px,2vh,16px)] text-lcd-ink/80 active:scale-95"
            >
              {t.assistant.discard}
            </button>
            <button
              type="button"
              onClick={() =>
                state.suggestion &&
                onConfirm(state.suggestion.mode_id, state.suggestion.temp_c)
              }
              className="rounded-full bg-red-500 px-[3vh] py-[1.1vh] text-[clamp(12px,2vh,16px)] font-medium text-white hover:bg-red-600 active:scale-95"
            >
              {t.assistant.apply}
            </button>
          </div>
        </>
      )}

      {state.phase === 'error' && (
        <>
          <p className="max-w-[90%] text-[clamp(13px,2.2vh,18px)] text-red-500">{state.error}</p>
          {textForm(t.assistant.askAgain)}
        </>
      )}
    </div>
  );
}

// Small "the device is talking" meter shown next to the suggestion while the
// spoken reply plays.
function Speaking() {
  const t = useTranslations();
  return (
    <div className="flex h-[3vh] items-center gap-[0.4vh]" aria-label={t.assistant.speakingAria}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="bg-lcd-ink/70 w-[0.5vh] rounded-full"
          style={{
            height: '100%',
            animation: `assistant-bar 0.8s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Listening() {
  return (
    <div className="flex h-[5vh] items-center gap-[0.6vh]">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-[0.8vh] rounded-full bg-red-500"
          style={{
            height: '100%',
            animation: `assistant-bar 0.9s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <span className="border-lcd-ink/25 border-t-lcd-ink h-[5vh] w-[5vh] animate-spin rounded-full border-[3px]" />
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
