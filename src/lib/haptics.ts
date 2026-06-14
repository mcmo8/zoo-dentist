/* Tiny haptics wrapper. navigator.vibrate is Android-Chrome only and absent on iOS
   / desktop, so every call is feature-checked and any error is swallowed — a no-op
   where unsupported. Patterns mirror the reference demos (single ms = a tick buzz;
   [on,off,...] = a stutter, e.g. the drill). */
export function buzz(pattern: number | number[]): void {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav && typeof nav.vibrate === 'function') nav.vibrate(pattern);
  } catch {
    /* ignore — some browsers throw on rapid calls */
  }
}
