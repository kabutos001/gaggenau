import { useState } from 'react';

import ModeGlyph from '../glyphs/ModeGlyph';
import type { ModeId } from '../types';
import type { AssistantState } from './useAssistant';

interface Props {
  state: AssistantState;
  celsius: boolean;
  onStartRecording: () => void;
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
  onStartRecording,
  onStopAndAsk,
  onAskText,
  onConfirm,
  onDismiss,
}: Props) {
  const [typed, setTyped] = useState('');

  const textForm = (submitLabel: string) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (typed.trim()) onAskText(typed.trim());
      }}
      className="flex w-full max-w-[92%] flex-col items-center gap-2"
    >
      <input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder="z. B. Obstkuchen für heute Abend"
        autoFocus
        className="text-lcd-ink placeholder:text-lcd-ink/30 w-full rounded-md border border-lcd-ink/25 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-lcd-ink/60"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-lcd-ink/30 px-4 py-1.5 text-xs text-lcd-ink/80"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={!typed.trim()}
          className="rounded-full bg-lcd-heat px-5 py-1.5 text-xs font-medium text-white active:scale-95 disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );

  return (
    <div className="text-lcd-ink absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#1c2228]/95 px-5 text-center backdrop-blur-sm">
      {state.phase === 'prompt' && (
        <>
          <p className="text-sm text-lcd-ink/85">Was kochst du heute?</p>
          <button
            type="button"
            onClick={onStartRecording}
            className="flex items-center gap-2 rounded-full bg-lcd-heat px-5 py-2 text-xs font-medium text-white active:scale-95"
          >
            Sprechen
          </button>
          <div className="flex w-full items-center gap-2 text-[10px] text-lcd-ink/35">
            <span className="h-px flex-1 bg-lcd-ink/20" />
            oder tippen
            <span className="h-px flex-1 bg-lcd-ink/20" />
          </div>
          {textForm('Fragen')}
        </>
      )}

      {state.phase === 'recording' && (
        <>
          <Listening />
          <p className="text-sm text-lcd-ink/80">Was kochst du heute?</p>
          <div className="mt-1 flex items-center gap-2">
            {/* Cancel — discards the recording client-side without sending it,
                for a misclicked mic. */}
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Aufnahme abbrechen"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-lcd-ink/30 text-lcd-ink/70 active:scale-95"
            >
              <XIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onStopAndAsk}
              className="rounded-full bg-lcd-heat px-5 py-1.5 text-xs font-medium text-white active:scale-95"
            >
              Fertig
            </button>
          </div>
        </>
      )}

      {state.phase === 'thinking' && (
        <>
          <Spinner />
          <p className="text-sm text-lcd-ink/70">Suche das passende Programm…</p>
        </>
      )}

      {state.phase === 'suggestion' && state.suggestion && (
        <>
          {state.suggestion.transcript && (
            <p className="max-w-[90%] text-[11px] text-lcd-ink/45 italic">
              „{state.suggestion.transcript}“
            </p>
          )}
          <div className="flex items-center gap-3">
            <ModeGlyph mode={state.suggestion.mode_id} className="text-lcd-ink h-9 w-9" />
            <div className="text-left">
              <div className="text-base leading-tight font-medium">
                {state.suggestion.mode_label}
              </div>
              <div className="text-lcd-ink/70 text-sm">
                {toDisp(state.suggestion.temp_c, celsius)}
                {celsius ? '°C' : '°F'}
              </div>
            </div>
          </div>
          {state.suggestion.rationale && (
            <p className="max-w-[92%] text-[11px] leading-snug text-lcd-ink/65">
              {state.suggestion.rationale}
            </p>
          )}
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full border border-lcd-ink/30 px-4 py-1.5 text-xs text-lcd-ink/80 active:scale-95"
            >
              Verwerfen
            </button>
            <button
              type="button"
              onClick={() =>
                state.suggestion &&
                onConfirm(state.suggestion.mode_id, state.suggestion.temp_c)
              }
              className="rounded-full bg-lcd-heat px-5 py-1.5 text-xs font-medium text-white active:scale-95"
            >
              Übernehmen
            </button>
          </div>
        </>
      )}

      {state.phase === 'error' && (
        <>
          <p className="max-w-[90%] text-sm text-lcd-heat">{state.error}</p>
          {textForm('Erneut fragen')}
        </>
      )}
    </div>
  );
}

function Listening() {
  return (
    <div className="flex h-8 items-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-lcd-heat"
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
    <span className="border-lcd-ink/25 border-t-lcd-ink h-7 w-7 animate-spin rounded-full border-2" />
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
