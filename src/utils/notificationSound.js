const SOUND_KEY = 'vconnect_notif_sound';

export function isNotificationSoundEnabled() {
  return localStorage.getItem(SOUND_KEY) !== 'false';
}

export function setNotificationSoundEnabled(enabled) {
  localStorage.setItem(SOUND_KEY, enabled ? 'true' : 'false');
}

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

/** Short Facebook-like notification ding via Web Audio (no asset file). */
export function playNotificationSound() {
  if (!isNotificationSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.connect(gain);
    osc1.start(now);
    osc1.stop(now + 0.2);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.1);
    osc2.connect(gain);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.45);
  } catch {
    /* autoplay or unsupported — ignore */
  }
}
