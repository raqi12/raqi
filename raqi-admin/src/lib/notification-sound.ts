const SOUND_MUTE_KEY = 'raqi.admin.notificationSoundMuted';
const SOUND_URLS = [
  '/sounds/notification.wav',
  '/sounds/notification.mp3',
  '/sounds/notification.ogg',
] as const;

let audio: HTMLAudioElement | null = null;
let unlocked = false;
let resolvedUrl: string | null = null;
let resolving: Promise<string | null> | null = null;
let unlockListenersBound = false;

function isMuted(): boolean {
  try {
    return localStorage.getItem(SOUND_MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function getNotificationSoundMuted(): boolean {
  return isMuted();
}

export function setNotificationSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(SOUND_MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function isAudioResponse(res: Response): boolean {
  if (!res.ok) return false;
  const type = res.headers.get('content-type')?.toLowerCase() ?? '';
  // SPA fallbacks often return index.html with 200 for missing /sounds/*.mp3
  if (type.includes('text/html')) return false;
  if (type.startsWith('audio/')) return true;
  const path = new URL(res.url, window.location.origin).pathname;
  const knownExt = /\.(wav|mp3|ogg|m4a|aac)$/i.test(path);
  // Some static hosts omit type or use octet-stream for binary assets.
  if (knownExt && (!type || type.includes('octet-stream'))) return true;
  return false;
}

async function resolveSoundUrl(): Promise<string | null> {
  if (resolvedUrl !== null) return resolvedUrl || null;
  if (resolving) return resolving;

  resolving = (async () => {
    for (const url of SOUND_URLS) {
      try {
        const res = await fetch(url, { method: 'GET', cache: 'force-cache' });
        if (isAudioResponse(res)) {
          resolvedUrl = url;
          return url;
        }
      } catch {
        /* try next */
      }
    }
    resolvedUrl = '';
    return null;
  })();

  return resolving;
}

function getAudio(url: string): HTMLAudioElement {
  const absolute = new URL(url, window.location.origin).href;
  if (!audio || audio.src !== absolute) {
    audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = 0.7;
  }
  return audio;
}

/** Call once after a user gesture so browsers allow later autoplay. */
export async function unlockNotificationSound(): Promise<void> {
  if (unlocked) return;
  const url = await resolveSoundUrl();
  if (!url) return;
  try {
    const el = getAudio(url);
    el.muted = true;
    await el.play();
    el.pause();
    el.currentTime = 0;
    el.muted = false;
    unlocked = true;
  } catch {
    // Keep unlocked=false so a later real user gesture can retry.
  }
}

/**
 * Bind once: unlock audio on the first pointer/key interaction anywhere
 * in the dashboard (browsers block autoplay until then).
 */
export function bindNotificationSoundUnlock(): void {
  if (typeof window === 'undefined' || unlockListenersBound) return;
  unlockListenersBound = true;

  const unlock = () => {
    void unlockNotificationSound().then(() => {
      if (!unlocked) return;
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    });
  };

  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
}

export async function playNotificationSound(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (isMuted()) return;

  const url = await resolveSoundUrl();
  if (!url) return;

  try {
    const el = getAudio(url);
    el.currentTime = 0;
    await el.play();
    unlocked = true;
  } catch {
    // Autoplay blocked until unlockNotificationSound() runs after a gesture.
  }
}
