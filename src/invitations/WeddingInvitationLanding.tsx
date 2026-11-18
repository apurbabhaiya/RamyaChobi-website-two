import React, { useEffect } from 'react';
import { CalendarDays, Camera, Film, Gift, Heart, Image as PhotoIcon, Link as LinkIcon, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { InvitationBrandPromotion, WeddingAdsterraSlot } from './InvitationPromotion';

const description = 'RamyaChobi wedding photography, cinematography and digital wedding invitations in Bangladesh. Explore elegant 3D-style invitation experiences, wedding films, portfolios and booking options.';

export default function WeddingInvitationLanding() {
  useEffect(() => {
    document.title = 'Wedding Invitation & Photography in Bangladesh | RamyaChobi';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement('meta');meta.name='description';document.head.appendChild(meta); }
    meta.content = description;
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robots) { robots = document.createElement('meta');robots.name='robots';document.head.appendChild(robots); }
    robots.content = 'index,follow';
    // Do not specify a canonical until a verified production public domain is chosen.
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-stone-900">
      <section className="relative overflow-hidden bg-[#193c32] px-5 py-16 text-white sm:py-24">
        <div className="pointer-events-none absolute -right-24 -top-40 h-[470px] w-[470px] rounded-full border-[40px] border-amber-300/10" aria-hidden="true"/>
        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[.23em] text-amber-300">RamyaChobi · Wedding Experience</p>
          <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-tight sm:text-6xl">Beautiful Wedding Invitations.<br/>Unforgettable Wedding Memories.</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50">বাংলাদেশে Wedding Photography, Cinematography এবং দৃষ্টিনন্দন Digital Wedding Invitation—একই RamyaChobi অভিজ্ঞতায়। আপনার বিশেষ দিনকে স্মরণীয় করতে আমাদের Portfolio ও Wedding Packages দেখুন।</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/portfolio" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 font-bold text-emerald-950 hover:bg-amber-200"><PhotoIcon size={18}/> Explore Wedding Portfolio</a>
            <a href="/packages" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 font-semibold hover:bg-white/20">Photography Packages</a>
          </div>
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-9 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_290px] lg:px-6 lg:py-16">
        <div className="min-w-0 space-y-9">
          <section aria-labelledby="invitation-benefits">
            <p className="text-xs font-bold uppercase tracking-[.21em] text-amber-800">Digital Wedding Invitations</p>
            <h2 id="invitation-benefits" className="mt-2 font-serif text-3xl sm:text-4xl">A thoughtful surprise for your guests</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700">Traditional invitations become an interactive online experience. Guests can open a 3D-style card, view the wedding countdown, find your venue, explore the event timeline and save wedding dates to their calendar.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                {icon:<Heart size={24}/>,title:'An elegant 3D-style reveal',body:'A beautifully designed envelope opens to show a personalized wedding invitation.'},
                {icon:<CalendarDays size={24}/>,title:'Events, Countdown & Calendar',body:'Share wedding dates, reception plans, celebration details and a downloadable calendar.'},
                {icon:<MessageCircle size={24}/>,title:'Easy WhatsApp Sharing',body:'One invite link that guests can open on phones without installing an app.'},
                {icon:<ShieldCheck size={24}/>,title:'Respectful by design',body:'Guests see wedding details only; the admin dashboard and client booking data stay separate.'}
              ].map(item=><article key={item.title} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><div className="text-amber-800">{item.icon}</div><h3 className="mt-3 font-serif text-xl font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-7 text-stone-600">{item.body}</p></article>)}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-amber-800">The RamyaChobi experience</p>
            <h2 className="mt-2 font-serif text-3xl">Photography that tells your story</h2>
            <p className="mt-4 leading-8 text-stone-700">The invitation announces the celebration; photography and wedding films preserve it. Explore our real portfolio, look at our wedding photography and cinematography offerings, and contact RamyaChobi to plan the coverage of your special day.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/portfolio" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-700 px-4 py-3 text-sm font-bold text-emerald-900"><Camera size={17}/> Photography Portfolio</a>
              <a href="/packages" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-700 px-4 py-3 text-sm font-bold text-emerald-900"><Film size={17}/> Wedding Packages</a>
              <a href="/booking" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#193c32] px-4 py-3 text-sm font-bold text-white"><Gift size={17}/> Plan an Event</a>
            </div>
          </section>
          <section aria-labelledby="invitation-faq" className="rounded-3xl border border-amber-200 bg-white/70 p-6 sm:p-9">
            <h2 id="invitation-faq" className="font-serif text-3xl">About our online invitations</h2>
            <div className="mt-5 space-y-5">
              <div><h3 className="text-base font-bold">Can guests open the card on their phones?</h3><p className="mt-1 text-sm leading-7 text-stone-600">Yes. The guest page is designed for mobile screens, including a tap-to-open card.</p></div>
              <div><h3 className="text-base font-bold">Can the invitation include wedding events?</h3><p className="mt-1 text-sm leading-7 text-stone-600">Yes. You can provide the date, time and venue for wedding celebrations and a visual event timeline.</p></div>
              <div><h3 className="text-base font-bold">Do guests need to install an app?</h3><p className="mt-1 text-sm leading-7 text-stone-600">No. Once the invitation is published on a public site, guests can follow a normal web link.</p></div>
            </div>
          </section>
        </div>
        <aside className="space-y-5 self-start lg:sticky lg:top-6" aria-label="RamyaChobi wedding photography and ad placement">
          <InvitationBrandPromotion compact/>
          <WeddingAdsterraSlot/>
          <p className="px-2 text-xs leading-6 text-stone-600">Advertising appears only on public marketing pages after approval. Personal invitations and private client information are not shared with advertising scripts.</p>
        </aside>
      </div>
    </main>
  );
}
