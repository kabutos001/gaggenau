import type { ModeId } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface CookSuggestion {
  transcript: string;
  mode_id: ModeId;
  mode_label: string;
  temp_c: number;
  rationale: string;
  dish: string;
}

// Send recorded audio (or a typed transcript) to the assistant and get back a
// suggested oven program. The backend transcribes via Gemini Live and selects
// the program with a structured Gemini call.
export async function askAssistant(
  input: { audio: ArrayBuffer; sampleRate: number } | { transcript: string }
): Promise<CookSuggestion> {
  const form = new FormData();
  if ('transcript' in input) {
    form.append('transcript', input.transcript);
    // The endpoint requires the audio field even when typing; send an empty blob.
    form.append('audio', new Blob([], { type: 'application/octet-stream' }));
  } else {
    form.append('audio', new Blob([input.audio], { type: 'application/octet-stream' }));
    form.append('sample_rate', String(input.sampleRate));
  }

  const response = await fetch(`${API_URL}/api/assistant/cook`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(40_000),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail ?? 'Assistant request failed');
  }
  return response.json() as Promise<CookSuggestion>;
}
