import type { ModeId } from '../types';

import { AudioQueue } from './audio';

// Resolve the API base, tolerating a VITE_API_URL with or without the `/api`
// suffix (docker-compose has historically set it both ways). Mirrors the
// normalizer in team-members.ts so the two clients agree.
const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_URL = (() => {
  const trimmed = RAW_API_URL.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
})();

// The WebSocket URL for the streaming voice path: same host as API_URL, with
// http(s) → ws(s).
const WS_URL = `${API_URL.replace(/^http/, 'ws')}/assistant/cook_ws`;

export interface CookSuggestion {
  transcript: string;
  mode_id: ModeId;
  mode_label: string;
  temp_c: number;
  rationale: string;
  dish: string;
  /** base64 PCM (24 kHz mono int16) of the spoken reply; empty on typed input. */
  reply_audio_b64?: string;
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

  const response = await fetch(`${API_URL}/assistant/cook`, {
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

export interface StreamCallbacks {
  /** Fired when the first reply-audio frame starts playing. */
  onSpeakingStart?: () => void;
  /** Fired once the spoken reply has finished playing out. */
  onSpeakingEnd?: () => void;
}

// Streaming voice path (WebSocket). Sends the recorded blob, plays the spoken
// reply frame-by-frame as it streams back (so it starts in a few seconds, not
// after the whole clip), and resolves with the program suggestion. Lower
// latency than askAssistant's buffered POST.
export function streamAssistant(
  input: { audio: ArrayBuffer; sampleRate: number },
  cb: StreamCallbacks = {}
): Promise<CookSuggestion> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    ws.binaryType = 'arraybuffer';

    const queue = new AudioQueue();
    let started = false;
    let settled = false;

    queue.onDrained = () => cb.onSpeakingEnd?.();

    const fail = (msg: string) => {
      if (settled) return;
      settled = true;
      queue.close();
      try {
        ws.close();
      } catch {
        /* already closing */
      }
      reject(new Error(msg));
    };

    const timeout = setTimeout(() => fail('Assistant timed out'), 45_000);

    ws.onopen = () => {
      ws.send(JSON.stringify({ sample_rate: input.sampleRate }));
      ws.send(input.audio);
      ws.send(JSON.stringify({ end: true }));
    };

    ws.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) {
        // A reply-audio frame — start the "speaking" signal on the first one.
        if (!started) {
          started = true;
          cb.onSpeakingStart?.();
        }
        queue.enqueue(e.data);
        return;
      }
      // Otherwise a JSON control message.
      const msg = JSON.parse(e.data as string);
      if (msg.type === 'error') {
        fail(msg.detail ?? 'Assistant error');
      } else if (msg.type === 'suggestion') {
        clearTimeout(timeout);
        settled = true;
        // Let any buffered audio finish; tell the queue no more is coming.
        queue.finish();
        resolve(msg as CookSuggestion);
      }
    };

    ws.onerror = () => fail('Connection failed');
    ws.onclose = () => {
      clearTimeout(timeout);
      if (!settled) fail('Connection closed before a suggestion arrived');
    };
  });
}
