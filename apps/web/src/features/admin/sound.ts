"use client";

/**
 * New-order alert sound, synthesized with Web Audio (no asset). Browsers only allow audio after a user
 * gesture, so the board asks the merchant to enable it once (the choice is remembered).
 */
let ctx: AudioContext | null = null;

export function unlockSound(): boolean {
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
    return true;
  } catch {
    return false;
  }
}

export function soundUnlocked(): boolean {
  return ctx !== null && ctx.state === "running";
}

/** Three short rising beeps, loud enough for a kitchen. */
export function playNewOrderAlert() {
  if (!ctx || ctx.state !== "running") return;
  const now = ctx.currentTime;
  [0, 0.25, 0.5].forEach((offset, i) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "square";
    osc.frequency.value = 880 + i * 220;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.4, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.2);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.22);
  });
}
