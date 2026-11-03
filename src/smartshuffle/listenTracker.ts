// Counts seconds actually listened, from player status updates. Seeks (jumps larger
// than maxStep, or backwards), pauses and buffering stalls add nothing.
export class ListenTracker {
  private id: string | null = null;
  private listened = 0;
  private last: number | null = null;

  constructor(private maxStep = 5) {}

  start(id: string): void { this.id = id; this.listened = 0; this.last = null; }

  update(currentTime: number, playing: boolean): void {
    if (this.id === null || !Number.isFinite(currentTime)) return;
    if (playing && this.last !== null) {
      const d = currentTime - this.last;
      if (d > 0 && d <= this.maxStep) this.listened += d;
    }
    this.last = currentTime;
  }

  seconds(): number { return this.listened; }
  activeId(): string | null { return this.id; }

  stop(): { id: string; seconds: number } | null {
    if (this.id === null) return null;
    const r = { id: this.id, seconds: this.listened };
    this.id = null; this.listened = 0; this.last = null;
    return r;
  }
}
