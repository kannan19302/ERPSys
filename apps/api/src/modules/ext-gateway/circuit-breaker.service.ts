import { Injectable } from '@nestjs/common';

interface Breaker {
  failures: number;
  openUntil: number; // epoch ms; 0 = closed
}

const FAILURE_THRESHOLD = 5; // consecutive failures before opening
const OPEN_MS = 15_000; // how long to stay open (fast-fail) before a trial request

/**
 * Per-app circuit breaker (#3). After N consecutive proxy failures the circuit
 * opens and requests fast-fail with 503 for a cooldown, sparing core request
 * threads from a dead/slow service. A single success closes it again.
 */
@Injectable()
export class CircuitBreakerService {
  private breakers = new Map<string, Breaker>();

  /** True when the circuit is open (caller should fast-fail). */
  isOpen(appSlug: string): boolean {
    const b = this.breakers.get(appSlug);
    if (!b || !b.openUntil) return false;
    if (Date.now() >= b.openUntil) {
      // Cooldown elapsed → half-open: allow one trial request through.
      b.openUntil = 0;
      return false;
    }
    return true;
  }

  recordSuccess(appSlug: string) {
    this.breakers.set(appSlug, { failures: 0, openUntil: 0 });
  }

  recordFailure(appSlug: string) {
    const b = this.breakers.get(appSlug) || { failures: 0, openUntil: 0 };
    b.failures += 1;
    if (b.failures >= FAILURE_THRESHOLD) {
      b.openUntil = Date.now() + OPEN_MS;
      b.failures = 0;
    }
    this.breakers.set(appSlug, b);
  }

  reset(appSlug: string) {
    this.breakers.delete(appSlug);
  }
}
