import { useCallback, useRef, useState } from 'react';

import { askAssistant, type CookSuggestion } from './api';
import { startPcmCapture, type PcmCapture } from './audio';

export type AssistantPhase =
  | 'idle'
  | 'prompt' // choose: speak or type
  | 'recording'
  | 'thinking'
  | 'suggestion'
  | 'error';

export interface AssistantState {
  phase: AssistantPhase;
  suggestion: CookSuggestion | null;
  error: string | null;
}

const INITIAL: AssistantState = { phase: 'idle', suggestion: null, error: null };

export function useAssistant() {
  const [state, setState] = useState<AssistantState>(INITIAL);
  const captureRef = useRef<PcmCapture | null>(null);

  const reset = useCallback(() => {
    captureRef.current?.cancel();
    captureRef.current = null;
    setState(INITIAL);
  }, []);

  // Open the prompt panel (offers speak or type).
  const open = useCallback(() => {
    setState({ phase: 'prompt', suggestion: null, error: null });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      captureRef.current = await startPcmCapture();
      setState({ phase: 'recording', suggestion: null, error: null });
    } catch {
      setState({
        phase: 'error',
        suggestion: null,
        error: 'Mikrofon nicht verfügbar — tippe deinen Wunsch ein.',
      });
    }
  }, []);

  const run = useCallback(async (input: { audio: ArrayBuffer; sampleRate: number } | { transcript: string }) => {
    setState({ phase: 'thinking', suggestion: null, error: null });
    try {
      const suggestion = await askAssistant(input);
      setState({ phase: 'suggestion', suggestion, error: null });
    } catch (e) {
      setState({
        phase: 'error',
        suggestion: null,
        error: e instanceof Error ? e.message : 'Etwas ist schiefgelaufen.',
      });
    }
  }, []);

  // Stop recording and send the captured audio for a suggestion.
  const stopAndAsk = useCallback(async () => {
    const cap = captureRef.current;
    captureRef.current = null;
    if (!cap) return;
    const { pcm, sampleRate } = cap.stop();
    await run({ audio: pcm, sampleRate });
  }, [run]);

  // Typed fallback (no mic).
  const askText = useCallback((transcript: string) => run({ transcript }), [run]);

  return { state, open, startRecording, stopAndAsk, askText, reset };
}
