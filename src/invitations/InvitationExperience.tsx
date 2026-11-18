import React, { useEffect, useMemo, useState } from 'react';
import { CalendarHeart, CalendarDays, Heart, MapPin, MessageCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { type WeddingInvite, type WeddingFunction, readableDate, readableTime } from './invitationModel';

function untilMoment(date: string, time: string) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const safeTime = /^\d{2}:\d{2}$/.test(time) ? time : '00:00';
  const instant = Date.parse(date + 'T' + safeTime + ':00+06:00');
  if (!Number.isFinite(instant)) return null;
  const delta = Math.max(0, instant - Date.now());
  const seconds = Math.floor(delta / 1000);
  return { passed: delta <= 0, days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, mins: Math.floor(seconds / 60) % 60, secs: seconds % 60 };
}

const gold = '#b38c50';

export default function InvitationExperience({ invite }: { invite: WeddingInvite }) {
  const [clock, setClock] = useState(() => untilMoment(invite.date, invite.time));
  const [activeImage, setActiveImage] = useState<number | null>(null);
  const [lanterns, setLanterns] = useState(false);
  const photos = useMemo(() => Array.from(new Set([invite.photo, ...(invite.photos || [])].filter(Boolean))).slice(0,5), [invite.photo, invite.photos]);
  const events: WeddingFunction[] = invite.events?.length ? invite.events : invite.date ? [{ name: invite.occasion, date: invite.date, time: invite.time, venue: invite.venue, dress: invite.dress || '' }] : [];
  useEffect(() => {
    setClock(untilMoment(invite.date, invite.time));
    const interval = window.setInterval(() => setClock(untilMoment(invite.date, invite.time)), 1000);
    return () => window.clearInterval(interval);
  }, [invite.date,invite.time]);
  useEffect(() => {
    if (activeImage === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveImage(null);
      if (event.key === 'ArrowLeft') setActiveImage(n => n === null ? null : (n-1+photos.length)%photos.length);
      if (event.key === 'ArrowRight') setActiveImage(n => n === null ? null : (n+1)%photos.length);
    };
    window.addEventListener('keydown', onKey);return () => window.removeEventListener('keydown',onKey);
  }, [activeImage,photos.length]);
  const rsvp = (invite.rsvp || '').replace(/\D/g,'');
  const responseText = encodeURIComponent('Hi, I will attend the wedding of '+invite.bride+' and '+invite.groom+'.');
  return <div className="mx-auto max-w-xl space-y-6 px-2 pb-10">
    {clock && <section id="countdown" className="invitation-glass-card p-6 text-center">
      <p className="text-xs font-bold uppercase tracking-[.22em] text-amber-800">Counting down to forever</p>
      <h2 className="mt-3 font-serif text-2xl text-stone-900">{clock.passed ? 'Just Married' : 'Until the Big Day'}</h2>
      {!clock.passed && <div className="mt-4 grid grid-cols-4 gap-2" aria-live="off">
        {([['Days',clock.days],['Hours',clock.hours],['Minutes',clock.mins],['Seconds',clock.secs]] as const).map(([name,num])=><div key={name} className="rounded-2xl border border-amber-200 bg-white/80 p-3"><div className="font-serif text-2xl font-bold text-amber-900 tabular-nums">{String(num).padStart(2,'0')}</div><span className="text-xs text-stone-600">{name}</span></div>)}
      </div>}
      <p className="mt-3 text-xs text-stone-600">Bangladesh time (UTC+06:00)</p>
    </section>}
    {events.length > 0 && <section className="invitation-glass-card p-6">
      <div className="text-center"><p className="text-xs font-bold uppercase tracking-[.22em] text-amber-800">Our celebrations</p><h2 className="mt-2 font-serif text-3xl">Wedding Events</h2></div>
      <div className="mt-6 space-y-0">
        {events.map((event,i)=><div key={event.name+event.date+i} className="relative flex gap-4 pb-7 last:pb-0">
          {i<events.length-1 && <span className="absolute bottom-0 left-[18px] top-10 border-l-2 border-dashed border-amber-300"/>}
          <div className="z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#193c32] font-serif text-lg text-white">{i+1}</div>
          <div className="min-w-0 flex-1 rounded-2xl border border-amber-100 bg-white/90 p-4">
            <h3 className="font-serif text-xl font-semibold">{event.name}</h3>
            <p className="mt-2 text-sm"><CalendarDays size={15} className="mr-1 inline text-amber-700"/>{readableDate(event.date)}{event.time?' · '+readableTime(event.time):''}</p>
            {event.venue && <p className="mt-2 text-sm"><MapPin size={15} className="mr-1 inline text-amber-700"/>{event.venue}</p>}
            {(event.dress || invite.dress) && <p className="mt-2 text-sm">Dress code: {event.dress || invite.dress}</p>}
            {event.venue && <a className="mt-3 inline-flex min-h-11 items-center rounded-full border border-amber-300 px-4 text-sm font-semibold text-amber-950" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(event.venue)} target="_blank" rel="noreferrer">Directions</a>}
          </div>
        </div>)}
      </div>
    </section>}
    {photos.length > 0 && <section className="invitation-glass-card p-5">
      <p className="text-center text-xs font-bold uppercase tracking-[.22em] text-amber-800">Moments to treasure</p>
      <h2 className="mt-2 text-center font-serif text-3xl">Our Album</h2>
      <div className="mt-5 grid grid-cols-2 gap-3">{photos.map((url,i)=><button key={url} type="button" onClick={()=>setActiveImage(i)} className="min-h-44 overflow-hidden rounded-2xl border-4 border-white shadow-md focus-visible:outline-4 focus-visible:outline-amber-600"><img src={url} alt={'Wedding couple photograph '+(i+1)} loading="lazy" referrerPolicy="no-referrer" className="h-44 w-full object-cover"/></button>)}</div>
    </section>}
    {(invite.family || rsvp) && <section className="invitation-glass-card p-6 text-center">
      <Heart size={28} strokeWidth={1.5} className="mx-auto text-amber-700"/>
      {invite.family && <p className="mt-3 font-serif text-xl">{invite.family}</p>}
      {rsvp && <a href={'https://wa.me/'+rsvp+'?text='+responseText} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#193c32] px-5 py-3 text-sm font-bold text-white"><MessageCircle size={18}/> RSVP on WhatsApp</a>}
    </section>}
    <div className="text-center">
      <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-amber-400 bg-white/75 px-5 py-3 text-sm font-bold text-amber-950" type="button" onClick={()=>{setLanterns(true);window.setTimeout(()=>setLanterns(false),2600)}}><Heart size={18}/> Release a Wish</button>
      {lanterns && <div className="invitation-wish-lanterns" aria-hidden="true">{[0,1,2].map(i=><span key={i} style={{animationDelay:i*.15+'s'}}>✦</span>)}</div>}
    </div>
    {activeImage !== null && photos[activeImage] && <div role="dialog" aria-modal="true" aria-label="Wedding photo viewer" className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-950/95 p-4" onClick={()=>setActiveImage(null)}>
      <button type="button" aria-label="Close photo viewer" className="absolute right-4 top-4 min-h-11 min-w-11 rounded-full bg-white p-3 text-stone-900" onClick={()=>setActiveImage(null)}><X/></button>
      <button type="button" aria-label="Previous photo" className="absolute left-2 top-1/2 min-h-11 min-w-11 rounded-full bg-white/90 p-3" onClick={e=>{e.stopPropagation();setActiveImage((activeImage-1+photos.length)%photos.length)}}><ChevronLeft/></button>
      <img src={photos[activeImage]} alt={'Couple photo '+(activeImage+1)} className="max-h-[82dvh] max-w-[85vw] object-contain" onClick={e=>e.stopPropagation()}/>
      <button type="button" aria-label="Next photo" className="absolute right-2 top-1/2 min-h-11 min-w-11 rounded-full bg-white/90 p-3" onClick={e=>{e.stopPropagation();setActiveImage((activeImage+1)%photos.length)}}><ChevronRight/></button>
      <span className="absolute bottom-5 text-sm text-white">{activeImage+1} / {photos.length}</span>
    </div>}
  </div>;
}
