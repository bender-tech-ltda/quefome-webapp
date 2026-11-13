/** Injectable clock; /__control/clock overrides it in test mode. */
export class Clock {
  private override: Date | null = null;
  now(): Date {
    return this.override ?? new Date();
  }
  set(date: Date | null) {
    this.override = date;
  }
}
