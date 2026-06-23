// Push-to-talk PCM capture. Records mic audio as 16 kHz mono int16 PCM (the
// rate the Gemini Live API expects) and returns one ArrayBuffer on stop.

const INPUT_SAMPLE_RATE = 16000;
// The Gemini Live API returns its spoken reply as 24 kHz mono int16 PCM.
const OUTPUT_SAMPLE_RATE = 24000;

export interface PcmResult {
  pcm: ArrayBuffer;
  /** Actual capture rate — browsers may ignore the requested 16 kHz, so the
   *  backend must be told the real rate to decode the audio correctly. */
  sampleRate: number;
}

export interface PcmCapture {
  stop(): PcmResult;
  cancel(): void;
}

export async function startPcmCapture(): Promise<PcmCapture> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { sampleRate: INPUT_SAMPLE_RATE, channelCount: 1, echoCancellation: true },
  });

  const ctx = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
  await ctx.audioWorklet.addModule('/pcm-processor.js');

  const source = ctx.createMediaStreamSource(stream);
  const worklet = new AudioWorkletNode(ctx, 'pcm-processor');
  const chunks: ArrayBuffer[] = [];

  worklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
    chunks.push(e.data);
  };
  source.connect(worklet);

  function cleanup() {
    worklet.disconnect();
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
  }

  return {
    stop(): PcmResult {
      const rate = ctx.sampleRate;
      cleanup();
      const total = chunks.reduce((sum, b) => sum + b.byteLength, 0);
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }
      return { pcm: merged.buffer, sampleRate: rate };
    },
    cancel(): void {
      cleanup();
    },
  };
}

// Play a base64 PCM clip (24 kHz mono int16) — the assistant's spoken reply.
// Resolves when playback finishes.
// Returns a no-op resolved promise for an empty clip (e.g. the typed path).
export async function playPcmB64(b64: string): Promise<void> {
  if (!b64) return;

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 0x8000;

  const ctx = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
  // The context can start suspended when created after an await (no direct user
  // gesture on this tick); resume so the reply actually plays.
  await ctx.resume();

  const buffer = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
  buffer.copyToChannel(float32, 0);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);

  const durationMs = (float32.length / OUTPUT_SAMPLE_RATE) * 1000;
  return new Promise((resolve) => {
    const done = () => {
      void ctx.close();
      resolve();
    };
    source.onended = done;
    // Safety valve so a missed onended never leaves the context dangling.
    setTimeout(done, durationMs + 1000);
    source.start();
  });
}

// Streaming PCM player for the live (WebSocket) path: enqueue 24 kHz int16
// frames as they arrive and they play back-to-back without gaps. Playback
// starts on the first frame instead of waiting for the whole clip. Ported from
// the batch25 reference AudioQueue, plus a drained-callback so the UI can clear
// its "speaking" state when the reply finishes.
export class AudioQueue {
  private ctx: AudioContext;
  private nextTime = 0;
  private pending = 0;
  private ended = false;
  /** Called once the last enqueued frame has finished playing. */
  onDrained?: () => void;

  constructor() {
    this.ctx = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
    void this.ctx.resume();
  }

  enqueue(pcmBytes: ArrayBuffer): void {
    const int16 = new Int16Array(pcmBytes);
    if (int16.length === 0) return;
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 0x8000;

    const buffer = this.ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
    buffer.copyToChannel(float32, 0);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);

    const startAt = Math.max(this.ctx.currentTime, this.nextTime);
    this.pending++;
    source.onended = () => {
      this.pending--;
      // Drained = the producer signalled end AND every frame has played out.
      if (this.ended && this.pending === 0) this.onDrained?.();
    };
    source.start(startAt);
    this.nextTime = startAt + buffer.duration;
  }

  // Signal that no more frames will arrive. onDrained fires once the queue
  // empties (immediately if nothing is pending).
  finish(): void {
    this.ended = true;
    if (this.pending === 0) this.onDrained?.();
  }

  close(): void {
    void this.ctx.close();
  }
}
