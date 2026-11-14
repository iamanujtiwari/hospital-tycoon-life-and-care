// Tiny procedural sound effects (Web Audio). Press M to mute.
let ctx = null, muted = false;
export function tone(freq, dur = .15, type = 'sine', vol = .07, delay = 0) {
  if (muted) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + delay;
    o.type = type; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.start(t); o.stop(t + dur);
  } catch (e) {}
}
export const sfx = { ding: () => { tone(880, .25); tone(1320, .35, 'sine', .06, .12) }, coin: () => { tone(1200, .08, 'square', .04); tone(1800, .18, 'square', .04, .08) }, beep: () => tone(1000, .05, 'sine', .04), click: () => tone(520, .04, 'triangle', .04) };
export const toggleMute = () => (muted = !muted);
