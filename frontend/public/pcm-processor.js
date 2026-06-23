/**
 * AudioWorklet processor: converts float32 mic input → int16 PCM chunks.
 * Accumulates 4096 samples before posting to avoid per-128-sample overhead.
 */
class PcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(4096);
    this._offset = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;

    let i = 0;
    while (i < channel.length) {
      const space = 4096 - this._offset;
      const toCopy = Math.min(space, channel.length - i);
      this._buffer.set(channel.subarray(i, i + toCopy), this._offset);
      this._offset += toCopy;
      i += toCopy;

      if (this._offset === 4096) {
        const int16 = new Int16Array(4096);
        for (let j = 0; j < 4096; j++) {
          const s = Math.max(-1, Math.min(1, this._buffer[j]));
          int16[j] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        this.port.postMessage(int16.buffer, [int16.buffer]);
        this._offset = 0;
      }
    }
    return true;
  }
}

registerProcessor('pcm-processor', PcmProcessor);
