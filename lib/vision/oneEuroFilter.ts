// 1€ Filter (One Euro Filter) - Casiez et al., ACM CHI 2012
// The gold standard HCI algorithm for noisy human biomechanical tracking (eye gaze, VR, mocap)
// Dynamically adjusts cutoff frequency based on movement speed:
// - At low speed (fixation): Low cutoff frequency eliminates micro-tremor and jitter.
// - At high speed (saccade): High cutoff frequency eliminates lag and latency.

class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  public filter(val: number, alpha: number): number {
    if (this.y === null) {
      this.s = val;
      this.y = val;
      return val;
    }
    this.y = alpha * val + (1 - alpha) * this.s!;
    this.s = this.y;
    return this.y;
  }

  public hasLastRawValue(): boolean {
    return this.y !== null;
  }

  public lastRawValue(): number {
    return this.y ?? 0;
  }

  public reset(): void {
    this.y = null;
    this.s = null;
  }
}

export class OneEuroFilter {
  private minCutoff: number; // Minimum cutoff frequency (Hz)
  private beta: number;      // Speed coefficient
  private dCutoff: number;   // Derivative cutoff frequency (Hz)
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTime: number | null = null;

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
  }

  private alpha(rate: number, cutoff: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    const te = 1.0 / rate;
    return 1.0 / (1.0 + tau / te);
  }

  public filter(val: number, timestampMs: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestampMs;
      return this.xFilter.filter(val, 1.0);
    }

    const dt = Math.max(1, timestampMs - this.lastTime) / 1000.0;
    this.lastTime = timestampMs;
    const rate = 1.0 / dt;

    // Estimate derivative (velocity)
    const prevVal = this.xFilter.lastRawValue();
    const dx = (val - prevVal) * rate;
    const edx = this.dxFilter.filter(dx, this.alpha(rate, this.dCutoff));

    // Dynamic cutoff based on speed
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(val, this.alpha(rate, cutoff));
  }

  public reset(): void {
    this.lastTime = null;
    this.xFilter.reset();
    this.dxFilter.reset();
  }
}

export class OneEuroFilter2D {
  private filterX: OneEuroFilter;
  private filterY: OneEuroFilter;

  constructor(minCutoff = 1.2, beta = 0.009, dCutoff = 1.0) {
    this.filterX = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterY = new OneEuroFilter(minCutoff, beta, dCutoff);
  }

  public filter(x: number, y: number, timestampMs: number): { x: number; y: number } {
    return {
      x: this.filterX.filter(x, timestampMs),
      y: this.filterY.filter(y, timestampMs),
    };
  }

  public reset(): void {
    this.filterX.reset();
    this.filterY.reset();
  }
}
