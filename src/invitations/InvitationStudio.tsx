import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ClipboardCopy, ExternalLink, HeartHandshake, MessageCircle, RefreshCw, Send, Sparkles } from 'lucide-react';
import WeddingInviteCard from './WeddingInviteCard';
import { createInviteUrl, EMPTY_INVITE, INVITE_THEMES, type WeddingInvite, normalizeInvite } from './invitationModel';
import './invitation.css';

export type InvitationBooking = {
  id: string; client_name: string; reference_no: string; bride_name?: string | null; groom_name?: string | null;
  deleted_at?: string | null;
};
export type InvitationEvent = {
  id: string; booking_id: string; event_name?: string | null; event_date?: string | null;
  start_time?: string | null; venue?: string | null; location?: string | null;
};

export default function InvitationStudio({ bookings, events }: { bookings: InvitationBooking[]; events: InvitationEvent[] }) {
  const [bookingId, setBookingId] = useState('');
  const [eventId, setEventId] = useState('');
  const [invite, setInvite] = useState<WeddingInvite>({ ...EMPTY_INVITE });
  const [notice, setNotice] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const activeBookings = useMemo(() => (Array.isArray(bookings) ? bookings : []).filter(b => !b.deleted_at), [bookings]);
  const clientEvents = useMemo(() => (Array.isArray(events) ? events : []).filter(e => e.booking_id === bookingId), [events, bookingId]);
  const chosenBooking = activeBookings.find(b => b.id === bookingId);
  const chosenEvent = clientEvents.find(e => e.id === eventId);

  function setField<K extends keyof WeddingInvite>(key: K, value: WeddingInvite[K]) {
    setInvite(prev => ({ ...prev, [key]: value }));
    setShareUrl('');
    setNotice('');
  }

  function chooseClient(id: string) {
    setBookingId(id);
    const b = activeBookings.find(item => item.id === id);
    const matching = (Array.isArray(events) ? events : []).filter(e => e.booking_id === id);
    setEventId(matching[0]?.id || '');
    setInvite(prev => ({ ...prev, bride: b?.bride_name || '', groom: b?.groom_name || '', occasion: matching[0]?.event_name || 'Wedding Celebration', date: matching[0]?.event_date || '', time: String(matching[0]?.start_time || '').slice(0,5), venue: matching[0]?.venue || '', address: matching[0]?.location || '', guest: '', events: matching.map(e=>({name:e.event_name||'',date:e.event_date||'',time:String(e.start_time||'').slice(0,5),venue:e.venue||'',dress:''})).filter(e=>e.name && e.date).slice(0,6) }));
    setShareUrl('');
    setNotice('');
  }

  function chooseEvent(id: string) {
    setEventId(id);
    const e = clientEvents.find(item => item.id === id);
    if (e) setInvite(prev => ({ ...prev, occasion: e.event_name || 'Wedding Celebration', date: e.event_date || '', time: String(e.start_time || '').slice(0,5), venue: e.venue || '', address: e.location || '' }));
    setShareUrl('');
  }

  const field = (title: string, key: keyof WeddingInvite, inputType = 'text', placeholder = '') => (
    <label className="block text-sm font-semibold text-stone-800">{title}
      <input type={inputType} maxLength={key === 'photo' ? 600 : key === 'address' ? 200 : 120} value={String(invite[key])} onChange={e => setField(key as keyof WeddingInvite, e.target.value as never)} placeholder={placeholder} className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-sm font-normal outline-none focus:border-amber-600" />
    </label>
  );

  function buildUrl(): string | null {
    const checked = normalizeInvite(invite);
    if (!checked || !checked.bride.trim() || !checked.groom.trim() || !checked.date || !checked.venue.trim()) {
      setNotice('বর-কনের নাম, তারিখ এবং ভেন্যু পূরণ করুন।');
      return null;
    }
    if (checked.photo !== invite.photo.trim() && invite.photo.trim()) {
      setNotice('ছবির জন্য একটি Public HTTPS image URL ব্যবহার করুন (private Drive link নয়)।');
      return null;
    }
    try {
      const url = createInviteUrl(checked);
      setShareUrl(url);
      setNotice('Invitation link ready. অতিথির কাছে পাঠানোর আগে কার্ডটি একবার খুলে দেখুন।');
      return url;
    } catch (error: any) { setNotice(error?.message || 'Link তৈরি করা যায়নি।'); return null; }
  }

  async function copyLink() {
    const url = buildUrl(); if (!url) return;
    try { await navigator.clipboard.writeText(url); setNotice('Invitation link কপি হয়েছে।'); }
    catch { setNotice('Copy ব্যর্থ হয়েছে। নিচের লিংকটি ম্যানুয়ালি কপি করুন।'); }
  }

  function shareWhatsapp() {
    const url = buildUrl(); if (!url) return;
    const message = encodeURIComponent('With love, you are invited to celebrate '+invite.bride+' & '+invite.groom+'. Open your special invitation: '+url);
    window.open('https://wa.me/?text='+message, '_blank', 'noopener,noreferrer');
  }

  useEffect(() => { document.title = 'Wedding Invitation Studio · RamyaChobi'; }, []);

  return (
    <section className="mx-auto max-w-[1450px] px-4 py-6" aria-label="Wedding Invitation Studio">
      <div className="overflow-hidden rounded-3xl bg-[#193c32] p-5 text-white md:p-8">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-amber-300"><Sparkles size={17}/> RAMYACHOBI · SURPRISE EXPERIENCE</div>
        <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">Wedding Invitation Studio</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-emerald-50">ক্লায়েন্ট বেছে নিন, বিয়ের তথ্য দিন, 3D wedding invitation তৈরি করুন এবং WhatsApp-এ অতিথিদের পাঠান। আলাদা ডাটাবেস, পেইড 3D প্লাগইন বা ছবি আপলোড দরকার নেই।</p>
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,.95fr)]">
        <div className="space-y-4">
          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold"><CalendarDays size={20} className="text-emerald-800"/> 1. ক্লায়েন্ট ও অনুষ্ঠান</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Booking Client
                <select className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm" value={bookingId} onChange={e => chooseClient(e.target.value)}>
                  <option value="">— Select a client —</option>
                  {activeBookings.map(b => <option key={b.id} value={b.id}>{b.reference_no} · {b.client_name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold">Event
                <select className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm" value={eventId} onChange={e => chooseEvent(e.target.value)}>
                  <option value="">— Select an event —</option>
                  {clientEvents.map(e => <option key={e.id} value={e.id}>{e.event_name || 'Event'} · {e.event_date || 'Date not set'}</option>)}
                </select>
              </label>
            </div>
            {chosenBooking && <p className="mt-3 text-xs text-stone-500">Selected: {chosenBooking.client_name} · {chosenBooking.reference_no}{chosenEvent ? ' · '+(chosenEvent.event_name || 'Event') : ''}. Invitation details can be edited independently; booking records will not change.</p>}
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold"><HeartHandshake size={20} className="text-emerald-800"/> 2. Invitation Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("Bride's name", 'bride', 'text', 'Bride')}
              {field("Groom's name", 'groom', 'text', 'Groom')}
              {field('Ceremony name', 'occasion', 'text', 'Wedding / Holud / Reception')}
              {field('Guest name (optional)', 'guest', 'text', 'Dear Family & Friends')}
              {field('Wedding date', 'date', 'date')}
              {field('Starting time (Bangladesh)', 'time', 'time')}
              {field('Venue', 'venue', 'text', 'Wedding venue')}
              {field('Location or full address', 'address', 'text', 'City, road, landmark')}
              <div className="sm:col-span-2">{field('Couple photo — Public HTTPS image URL (optional)', 'photo', 'url', 'https://example.com/your-photo.jpg')}</div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {field('Dress code (optional)', 'dress', 'text', 'Traditional / Festive')}
              {field('Family blessings / hosted by (optional)', 'family', 'text', 'With love from both families')}
              {field('RSVP WhatsApp number (optional)', 'rsvp', 'tel', '+8801XXXXXXXXX')}
            </div>
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h4 className="font-bold text-stone-900">Functions & Celebration Timeline</h4>
              <p className="mt-1 text-xs text-stone-600">Booking-এর Event থেকে স্বয়ংক্রিয়ভাবে লোড হয়। চাইলে Holud, Mehndi, Wedding ও Reception এডিট করুন। পরিবর্তন Booking-এ সেভ হবে না।</p>
              {(invite.events||[]).map((event,index) => <div key={index} className="mt-3 rounded-xl border border-amber-200 bg-white p-3">
                <div className="mb-2 flex justify-between gap-2"><strong className="text-sm">Event {index+1}</strong><button type="button" className="text-sm font-bold text-red-800" onClick={()=>setField('events',(invite.events||[]).filter((_,i)=>i!==index))}>Remove</button></div>
                <div className="grid grid-cols-2 gap-2">
                  {(['name','date','time','venue','dress'] as const).map(key => <label key={key} className={'text-xs font-semibold '+(key==='venue'?'col-span-2':'')}>{key}
                    <input aria-label={'Event '+(index+1)+' '+key} value={event[key]} type={key==='date'?'date':key==='time'?'time':'text'} maxLength={120} onChange={e => setField('events',(invite.events||[]).map((entry,i)=>i===index?{...entry,[key]:e.target.value}:entry))} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm"/>
                  </label>)}
                </div>
              </div>)}
              <button type="button" disabled={(invite.events||[]).length>=6} onClick={()=>setField('events',[...(invite.events||[]),{name:'',date:'',time:'',venue:'',dress:''}])} className="mt-3 min-h-11 rounded-xl border border-emerald-700 px-4 text-sm font-bold text-emerald-900 disabled:opacity-40">+ Add Event (up to 6)</button>
            </div>
            <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <h4 className="font-bold text-stone-900">Couple Photo Album</h4>
              <p className="mt-1 text-xs text-stone-600">মূল ছবি ছাড়া আরও ৩টি Public HTTPS image URL দিতে পারবেন। ছবিগুলো অতিথিদের জন্য দৃশ্যমান হবে।</p>
              {(invite.photos||[]).map((url,index)=><label key={index} className="mt-3 flex items-center gap-2 text-xs font-semibold">
                <span className="shrink-0">Photo {index+2}</span>
                <input type="url" value={url} onChange={e=>setField('photos',(invite.photos||[]).map((item,i)=>i===index?e.target.value:item))} placeholder="https://..." className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2.5 text-sm"/>
                <button type="button" className="min-h-11 px-2 text-red-800" onClick={()=>setField('photos',(invite.photos||[]).filter((_,i)=>i!==index))}>✕</button>
              </label>)}
              <button type="button" disabled={(invite.photos||[]).length>=3} onClick={()=>setField('photos',[...(invite.photos||[]),''])} className="mt-3 min-h-11 rounded-xl border border-emerald-700 px-4 text-sm font-bold text-emerald-900 disabled:opacity-40">+ Add Photo URL (up to 3)</button>
            </div>
            <label className="mt-4 block text-sm font-semibold">Personal Message
              <textarea maxLength={280} rows={3} value={invite.message} onChange={e => setField('message', e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-sm font-normal" placeholder="You're invited to celebrate with us…"/>
            </label>
            <p className="mt-3 text-xs leading-5 text-stone-500">শুধু প্রকাশ্যে দেখানো যাবে এমন ছবি ব্যবহার করুন। Private Google Drive/Client Gallery লিংক ব্যবহার করবেন না। ব্যক্তিগত নম্বর, Payment, অ্যাডমিন বা গোপন তথ্য Invitation Link-এ রাখবেন না।</p>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold">3. ডিজাইন বেছে নিন</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(Object.entries(INVITE_THEMES) as [WeddingInvite['theme'], typeof INVITE_THEMES.emerald][]).map(([key, theme]) => (
                <button type="button" key={key} onClick={() => setField('theme', key)} aria-pressed={invite.theme===key} className={'rounded-xl border-2 p-2 text-center text-xs font-bold '+(invite.theme===key?'border-amber-600':'border-transparent')} style={{background:theme.light,color:theme.dark}}>
                  <span className="mx-auto mb-2 block h-9 w-9 rounded-full border-4" style={{background:theme.dark,borderColor:theme.accent}}/>
                  {theme.title}
                  {invite.theme===key && <span className="mt-1 flex justify-center"><Check size={15}/></span>}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold">4. Preview & Share</h3>
            <p className="mt-1 text-sm text-stone-600">Guest-এর কাছে পাঠানোর আগে Preview লিংক খুলে চেক করুন।</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={copyLink} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#193c32] px-4 font-bold text-white"><ClipboardCopy size={17}/> Copy Invitation Link</button>
              <button type="button" onClick={shareWhatsapp} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#217447] px-4 font-bold text-white"><MessageCircle size={17}/> Share on WhatsApp</button>
              <button type="button" onClick={() => {const url = buildUrl();if(url)window.open(url,'_blank','noopener,noreferrer');}} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-300 px-4 font-bold"><ExternalLink size={17}/> Open Guest View</button>
            </div>
            {shareUrl && <label className="mt-4 block text-xs font-semibold">Invitation URL
              <textarea readOnly value={shareUrl} rows={3} onFocus={e=>e.target.select()} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-3 text-xs font-normal break-all"/>
            </label>}
            {notice && <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">{notice}</p>}
            <p className="mt-3 text-xs text-stone-500">ফ্রি সংস্করণ: লিংকেই তথ্য থাকে, সার্ভারে কোনো Invitation Draft সংরক্ষিত হয় না। ভিন্ন অতিথির জন্য Guest Name বদলে আলাদা লিংক Copy করুন।</p>
          </section>
        </div>
        <aside className="sticky top-24 rounded-3xl border border-amber-200 bg-[#eee6d6] p-4 shadow-xl lg:p-6" aria-label="Live invitation preview">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div><p className="text-[10px] font-black tracking-[.17em] text-amber-900">INTERACTIVE 3D PREVIEW</p><h3 className="font-serif text-xl font-bold text-stone-900">Your Invitation</h3></div>
            <button type="button" className="min-h-10 rounded-full border border-stone-300 bg-white px-3 text-xs font-bold text-stone-900" onClick={() => setInvite({...EMPTY_INVITE})}><RefreshCw size={14} className="mr-1 inline"/>Reset</button>
          </div>
          <WeddingInviteCard invite={invite} compact/>
          <p className="mt-2 text-center text-xs leading-5 text-stone-600">কার্ডের উপর ট্যাপ করলে 3D animation-এ খুলবে। Mobile-এও কাজ করে।</p>
        </aside>
      </div>
    </section>
  );
}
