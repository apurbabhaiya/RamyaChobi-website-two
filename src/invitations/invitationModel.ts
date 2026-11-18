export type InvitationTheme = 'emerald' | 'rose' | 'royal';

export type WeddingInvite = {
  v: 1;
  bride: string;
  groom: string;
  occasion: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  guest: string;
  message: string;
  photo: string;
  theme: InvitationTheme;
};

export const EMPTY_INVITE: WeddingInvite = {
  v: 1,
  bride: '',
  groom: '',
  occasion: 'Wedding Celebration',
  date: '',
  time: '',
  venue: '',
  address: '',
  guest: '',
  message: 'With love and blessings, we invite you to celebrate our special day.',
  photo: '',
  theme: 'emerald',
};

export const INVITE_THEMES: Record<InvitationTheme, { title: string; dark: string; accent: string; light: string; paper: string }> = {
  emerald: { title: 'Emerald & Gold', dark: '#193c32', accent: '#b38c50', light: '#fbf5e7', paper: '#fffefb' },
  rose: { title: 'Blush Romance', dark: '#532c44', accent: '#b45f82', light: '#fae9ef', paper: '#fffafd' },
  royal: { title: 'Midnight Royal', dark: '#1b2845', accent: '#c5a76d', light: '#e9edf9', paper: '#fffdf7' },
};

export function safeInvitePhoto(input: string): string {
  try {
    if (!input || input.length > 600) return '';
    const parsed = new URL(input.trim());
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.href : '';
  } catch {
    return '';
  }
}

export function normalizeInvite(value: unknown): WeddingInvite | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (data.v !== 1) return null;
  const take = (key: keyof WeddingInvite, max: number): string => typeof data[key] === 'string' ? String(data[key]).trim().slice(0, max) : '';
  const theme: InvitationTheme = data.theme === 'rose' || data.theme === 'royal' ? data.theme : 'emerald';
  const date = take('date', 10);
  const time = take('time', 5);
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date + 'T00:00:00Z').getTime()))) return null;
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const candidate: WeddingInvite = {
    v: 1,
    bride: take('bride', 90),
    groom: take('groom', 90),
    occasion: take('occasion', 70) || 'Wedding Celebration',
    date,
    time,
    venue: take('venue', 120),
    address: take('address', 200),
    guest: take('guest', 90),
    message: take('message', 280),
    photo: safeInvitePhoto(take('photo', 600)),
    theme,
  };
  return candidate;
}

export function encodeInvite(value: WeddingInvite): string {
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  if (encoded.length > 3200) throw new Error('Invitation text is too long. Shorten the notes or photo URL.');
  const binary = Array.from(encoded, byte => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeInvite(hash: string): WeddingInvite | null {
  try {
    const raw = hash.startsWith('#') ? hash.slice(1) : hash;
    if (!raw.startsWith('i=') || raw.length > 5200) return null;
    const payload = raw.slice(2);
    if (!/^[A-Za-z0-9_-]+$/.test(payload)) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return normalizeInvite(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export function createInviteUrl(invite: WeddingInvite): string {
  return window.location.origin + '/invitation#i=' + encodeInvite(invite);
}

export function readableDate(value: string): string {
  if (!value) return 'Date to be announced';
  const date = new Date(value + 'T12:00:00Z');
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export function readableTime(value: string): string {
  if (!value) return 'Time to be announced';
  const [hour, minute] = value.split(':').map(Number);
  const h = hour % 12 || 12;
  return String(h) + ':' + String(minute).padStart(2, '0') + (hour < 12 ? ' AM' : ' PM') + ' (BDT)';
}
