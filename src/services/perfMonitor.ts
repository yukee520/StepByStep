type Sample = {
  label: string;
  value: number;
  ts: number;
};

class PerfMonitor {
  private samples = new Map<string, Sample[]>();
  private marks = new Map<string, number>();
  private maxSamples = 120;
  private onUpdate: (() => void) | null = null;

  mark(name: string): void {
    this.marks.set(name, Date.now());
  }

  since(name: string): number {
    const start = this.marks.get(name);
    if (start === undefined) {
      return 0;
    }
    return Date.now() - start;
  }

  record(label: string, value: number): void {
    let arr = this.samples.get(label);
    if (!arr) {
      arr = [];
      this.samples.set(label, arr);
    }
    arr.push({ label, value, ts: Date.now() });
    if (arr.length > this.maxSamples) {
      arr.shift();
    }
    this.onUpdate?.();
  }

  setOnUpdate(cb: (() => void) | null): void {
    this.onUpdate = cb;
  }

  get(label: string): Sample[] {
    return this.samples.get(label) ?? [];
  }

  averages(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [label, arr] of this.samples.entries()) {
      if (arr.length === 0) {
        out[label] = 0;
        continue;
      }
      const sum = arr.reduce((a, s) => a + s.value, 0);
      out[label] = sum / arr.length;
    }
    return out;
  }

  max(label: string): number {
    const arr = this.samples.get(label) ?? [];
    let m = 0;
    for (const s of arr) {
      if (s.value > m) {
        m = s.value;
      }
    }
    return m;
  }

  clear(): void {
    this.samples.clear();
    this.marks.clear();
  }
}

export const perfMonitor = new PerfMonitor();