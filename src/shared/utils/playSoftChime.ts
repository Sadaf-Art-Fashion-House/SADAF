/**
 * SADAF | Shared — Soft Chime
 *
 * The signature SADAF alert sound: a soft two-note "ding-ding" (A5 → D6)
 * synthesized with the Web Audio API — no asset file, works offline, never
 * needs a network round-trip.
 *
 * Shared by the My Activity feed (useActivityAlerts) and the Leaderboard
 * overtake alert (useOvertakeAlerts) so both alert systems use the exact
 * same sound. The AudioContext is a module-level singleton, created on the
 * first call (ideally inside a user gesture when a toggle is enabled).
 */

let audioContext: AudioContext | null = null;

/** A5 → D6 — the SADAF soft two-note "ding-ding". */
const CHIME_NOTES_HZ = [880, 1174.66];
const CHIME_VOLUME = 0.05;

/** Play the soft chime. Best-effort — never throws or breaks the caller. */
export function playSoftChime(): void {
    try {
        if (typeof window === 'undefined') return;

        const AudioContextClass =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }
        const context = audioContext;
        if (context.state === 'suspended') void context.resume();

        const now = context.currentTime;
        CHIME_NOTES_HZ.forEach((frequency, index) => {
            const start = now + index * 0.09;
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(CHIME_VOLUME, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(start);
            oscillator.stop(start + 0.55);
        });
    } catch {
        // Sound is best-effort — never let it break the caller.
    }
}
