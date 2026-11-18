export type InvitationTheme = 'emerald' | 'rose' | 'royal';

export type WeddingFunction = { name: string; date: string; time: string; venue: string; dress: string };

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
  events?: WeddingFunction[];
  photos?: string[];
  rsvp?: string;
  family?: string;
  dress?: string;
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
  events: [],
  photos: [],
  rsvp: '',
  family: '',
  dress: '',
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
  const cleanText = (value: unknown, max: number): string => typeof value === 'string' ? value.trim().slice(0, max) : '';
  const cleanDate = (value: unknown): string => { const s = cleanText(value, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s+'T00:00:00Z')) ? s : ''; };
  const cleanTime = (value: unknown): string => { const s = cleanText(value, 5); return /^([01]\d|2[0-3]):[0-5]\d$/.test(s) ? s : ''; };
  const take = (key: keyof WeddingInvite, max: number): string => typeof data[key] === 'string' ? String(data[key]).trim().slice(0, max) : '';
  const theme: InvitationTheme = data.theme === 'rose' || data.theme === 'royal' ? data.theme : 'emerald';
  const date = take('date', 10);
  const time = take('time', 5);
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date + 'T00:00:00Z').getTime()))) return null;
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const events: WeddingFunction[] = (Array.isArray(data.events) ? data.events : []).slice(0, 6).map(item => ({
    name: cleanText(item?.name, 80), date: cleanDate(item?.date), time: cleanTime(item?.time),
    venue: cleanText(item?.venue, 120), dress: cleanText(item?.dress, 70),
  })).filter(e => e.name && e.date);
  const photos = (Array.isArray(data.photos) ? data.photos : []).slice(0, 5).map(url => safeInvitePhoto(cleanText(url, 600))).filter(Boolean);
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
    events,
    photos,
    rsvp: cleanText(data.rsvp, 30).replace(/[^+\d]/g, ''),
    family: cleanText(data.family, 120),
    dress: cleanText(data.dress, 70),
  };
  return candidate;
}

export function encodeInvite(value: WeddingInvite): string {
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  if (encoded.length > 6200) throw new Error('Invitation text is too long. Shorten the notes or photo URL.');
  const binary = Array.from(encoded, byte => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeInvite(hash: string): WeddingInvite | null {
  try {
    const raw = hash.startsWith('#') ? hash.slice(1) : hash;
    if (!raw.startsWith('i=') || raw.length > 9000) return null;
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

/** Client-side ICS export. Bangladesh time is UTC+06:00; nothing is stored remotely. */
export function downloadWeddingCalendar(invite: WeddingInvite): void {
  const events = invite.events?.length ? invite.events : [{ name: invite.occasion, date: invite.date, time: invite.time, venue: invite.venue, dress: invite.dress || '' }];
  const escapeText = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const items = events.filter(e=>e.name && /^\d{4}-\d{2}-\d{2}$/.test(e.date)).map((event, i) => {
    const date = new Date(event.date+'T'+(event.time||'12:00')+':00+06:00');
    if (!Number.isFinite(date.getTime())) return '';
    const end = new Date(date.getTime() + 2 * 3600_000);
    const summary = escapeText(event.name+' · '+invite.bride+' & '+invite.groom);
    return ['BEGIN:VEVENT','UID:ramyachobi-'+event.date+'-'+i+'@invitation','DTSTAMP:'+stamp(new Date()),'DTSTART:'+stamp(date),'DTEND:'+stamp(end),'SUMMARY:'+summary,'LOCATION:'+escapeText(event.venue||invite.venue),'DESCRIPTION:'+escapeText(invite.message),'END:VEVENT'].join('\r\n');
  }).filter(Boolean);
  if (!items.length) return;
  const body = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//RamyaChobi//Wedding Invitation//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH',...items,'END:VCALENDAR'].join('\r\n');
  const objectUrl = URL.createObjectURL(new Blob([body],{type:'text/calendar;charset=utf-8'}));
  const anchor = document.createElement('a');anchor.href=objectUrl;anchor.download='ramyachobi-wedding-invitation.ics';document.body.appendChild(anchor);anchor.click();anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(objectUrl),3000);
}
