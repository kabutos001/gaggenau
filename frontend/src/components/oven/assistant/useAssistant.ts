import { useCallback, useRef, useState } from 'react';

import { useTranslations } from '../../../i18n/context';
import { askAssistant, streamAssistant, type CookSuggestion } from './api';
import { startPcmCapture, type PcmCapture } from './audio';

export type AssistantPhase =
  | 'idle'
  | 'recording'
  | 'thinking'
  | 'suggestion'
  | 'error';

export interface AssistantState {
  phase: AssistantPhase;
  suggestion: CookSuggestion | null;
  error: string | null;
  /** True while the spoken reply is playing through the speaker. */
  speaking: boolean;
}

const INITIAL: AssistantState = {
  phase: 'idle',
  suggestion: null,
  error: null,
  speaking: false,
};

export function useAssistant() {
  const t = useTranslations();
  const [state, setState] = useState<AssistantState>(INITIAL);
  const captureRef = useRef<PcmCapture | null>(null);

  const reset = useCallback(() => {
    captureRef.current?.cancel();
    captureRef.current = null;
    setState(INITIAL);
  }, []);

  // Hot mic: invoked straight from the trigger button, so it starts capturing
  // immediately. Falls back to the typed-input panel (error phase) if the mic
  // is unavailable.
  const startRecording = useCallback(async () => {
    try {
      captureRef.current = await startPcmCapture();
      setState({ phase: 'recording', suggestion: null, error: null, speaking: false });
    } catch {
      setState({
        phase: 'error',
        suggestion: null,
        error: t.assistant.micUnavailable,
        speaking: false,
      });
    }
  }, [t]);

  const fail = useCallback(
    (e: unknown) => {
      setState({
        phase: 'error',
        suggestion: null,
        error: e instanceof Error ? e.message : t.assistant.genericError,
        speaking: false,
      });
    },
    [t]
  );

  // Stop recording and stream the captured audio. The spoken reply plays back
  // frame-by-frame as it arrives (low latency); the program suggestion appears
  // for confirmation as soon as it's ready.
  const stopAndAsk = useCallback(async () => {
    const cap = captureRef.current;
    captureRef.current = null;
    if (!cap) return;
    const { pcm, sampleRate } = cap.stop();
    setState({ phase: 'thinking', suggestion: null, error: null, speaking: false });
    try {
      const suggestion = await streamAssistant(
        { audio: pcm, sampleRate },
        {
          onSpeakingStart: () =>
            setState((s) => (s.phase !== 'error' ? { ...s, speaking: true } : s)),
          onSpeakingEnd: () => setState((s) => ({ ...s, speaking: false })),
        }
      );
      setState((s) => ({
        ...s,
        phase: 'suggestion',
        suggestion,
        error: null,
      }));
    } catch (e) {
      fail(e);
    }
  }, [fail]);

  // Typed fallback (no mic): buffered POST, program suggestion only (no audio).
  const askText = useCallback(
    async (transcript: string) => {
      setState({ phase: 'thinking', suggestion: null, error: null, speaking: false });
      try {
        const suggestion = await askAssistant({ transcript });
        setState({ phase: 'suggestion', suggestion, error: null, speaking: false });
      } catch (e) {
        fail(e);
      }
    },
    [fail]
  );

  return { state, startRecording, stopAndAsk, askText, reset };
}
