// Push-to-talk PCM capture. Records mic audio as 16 kHz mono int16 PCM (the
// rate the Gemini Live API expects) and returns one ArrayBuffer on stop.
// Ported from the batch25 reference stack.

const INPUT_SAMPLE_RATE = 16000;

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
