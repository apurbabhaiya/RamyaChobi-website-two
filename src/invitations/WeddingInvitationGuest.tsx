import React, { useEffect, useState } from 'react';
import { CalendarDays, HeartHandshake, MapPin, Share2 } from 'lucide-react';
import WeddingInviteCard from './WeddingInviteCard';
import InvitationExperience from './InvitationExperience';
import { decodeInvite, downloadWeddingCalendar, readableDate, readableTime, type WeddingInvite } from './invitationModel';
import './invitation.css';

export default function WeddingInvitationGuest() {
  const [invite, setInvite] = useState<WeddingInvite | null>(() => decodeInvite(window.location.hash));
  useEffect(() => {
    const onChange = () => setInvite(decodeInvite(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  useEffect(() => {
    document.title = invite ? (invite.bride + ' & ' + invite.groom + ' · Wedding Invitation · RamyaChobi') : 'Wedding Invitation · RamyaChobi';
    const previous = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (previous) previous.content = 'noindex,nofollow';
    return () => { document.title = 'RamyaChobi'; };
  }, [invite]);

  if (!invite) return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f4eedf] px-5 py-12 text-center">
      <section className="w-full max-w-lg rounded-3xl border border-amber-200 bg-white p-8 shadow-lg">
        <HeartHandshake size={40} className="mx-auto text-amber-700"/>
        <h1 className="mt-4 font-serif text-3xl text-stone-900">Wedding Invitation</h1>
        <p className="mt-3 text-stone-600">This invitation link is missing or incomplete. Please ask your host for a new link.</p>
        <a href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#193c32] px-6 font-bold text-white">Visit RamyaChobi</a>
      </section>
    </main>
  );

  const currentInvite = invite;
  const dateValid = Boolean(currentInvite.date) && /^\d{4}-\d{2}-\d{2}$/.test(currentInvite.date);
  function calendarLink() {
    if (!dateValid) return '';
    const end = new Date(currentInvite.date + 'T00:00:00Z');
    end.setUTCDate(end.getUTCDate() + 1);
    const dateCompact = currentInvite.date.replaceAll('-', '');
    const endCompact = end.toISOString().slice(0,10).replaceAll('-', '');
    const when = currentInvite.time ? 'dates='+dateCompact+'T'+currentInvite.time.replace(':','')+'00/'+dateCompact+'T'+currentInvite.time.replace(':','')+'00' : 'dates='+dateCompact+'/'+endCompact;
    // Google Calendar start time is interpreted as local timezone when ctz is present.
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(currentInvite.occasion+' · '+currentInvite.bride+' & '+currentInvite.groom)+'&'+when+'&ctz=Asia%2FDhaka&details='+encodeURIComponent(currentInvite.message)+'&location='+encodeURIComponent([currentInvite.venue,currentInvite.address].filter(Boolean).join(', '));
  }
  const venueQuery = [currentInvite.venue,currentInvite.address].filter(Boolean).join(', ');
  return <main className="min-h-dvh overflow-hidden bg-[radial-gradient(ellipse_at_top,#fff9ef,#e6dbc6_70%,#c4af8c)] px-3 py-7 text-stone-900 sm:py-12">
    <div className="mx-auto max-w-xl text-center">
      <div className="text-xs font-bold uppercase tracking-[.25em] text-amber-900">A little love. A beautiful moment.</div>
      <h1 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">You're Invited</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-700">Tap the invitation to unfold a special message from {currentInvite.bride} and {currentInvite.groom}.</p>
      <WeddingInviteCard invite={invite}/>
      <a href="#countdown" className="mb-4 inline-flex min-h-11 items-center rounded-full border border-amber-400 bg-white/70 px-5 py-3 text-sm font-bold text-amber-950">Save the Date ↓</a>
      <div className="mt-2 rounded-3xl border border-white/80 bg-white/75 p-5 shadow-sm backdrop-blur-sm">
        <p className="font-serif text-xl font-semibold">{currentInvite.occasion}</p>
        <p className="mt-2 text-sm"><CalendarDays size={16} className="mr-2 inline text-amber-800"/>{readableDate(currentInvite.date)} · {readableTime(currentInvite.time)}</p>
        {venueQuery && <p className="mt-2 text-sm"><MapPin size={16} className="mr-2 inline text-amber-800"/>{venueQuery}</p>}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {dateValid && <a href={calendarLink()} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold"><CalendarDays size={16}/> Add to calendar</a>}
          {dateValid && <button type="button" onClick={() => downloadWeddingCalendar(currentInvite)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold"><CalendarDays size={16}/> All Events (.ics)</button>}
          {venueQuery && <a href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(venueQuery)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#193c32] px-4 py-2 text-sm font-bold text-white"><MapPin size={16}/> Directions</a>}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && <button type="button" onClick={() => {void navigator.share({title:'Wedding Invitation',text:currentInvite.bride+' & '+currentInvite.groom,url:window.location.href}).catch(()=>{});}} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold"><Share2 size={16}/> Share</button>}
        </div>
        <div className="mt-6 border-t border-amber-200 pt-4"><p className="font-serif text-xs tracking-[.2em] text-stone-500">WITH LOVE FROM</p><a href="/" className="mt-1 block font-serif text-lg font-bold text-[#193c32]">RAMYACHOBI</a></div>
      </div>
      <div className="mt-6"><InvitationExperience invite={currentInvite}/></div>
    </div>
  </main>;
}
