import React from 'react';
import { Camera, ExternalLink, HeartHandshake, Image as PhotoIcon, Sparkles } from 'lucide-react';

/**
 * House promotion on invitation pages. Never load third-party scripts on
 * personalized guest URLs: the URL fragment contains the invitation data.
 */
export function InvitationBrandPromotion({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-label="Photography partner" className="overflow-hidden rounded-3xl border border-amber-200 bg-[#193c32] text-left text-white shadow-lg">
      <div className={compact ? 'p-5' : 'p-6'}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.19em] text-amber-200"><Camera size={17} /> Photography & Cinematography</div>
        <h2 className="mt-3 font-serif text-2xl font-semibold tracking-wide">RamyaChobi</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-50/90">Beautiful invitations deserve beautiful memories. Explore our wedding photography, films and heartfelt stories.</p>
        <div className="mt-5 grid gap-2">
          <a href="/wedding-invitations" className="flex min-h-11 items-center justify-between rounded-xl border border-amber-200/35 bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/20"><span className="inline-flex items-center gap-2"><Sparkles size={18}/> Digital Wedding Invitations</span><ExternalLink size={16}/></a>
          <a href="/portfolio" className="flex min-h-11 items-center justify-between rounded-xl border border-amber-200/35 bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/20"><span className="inline-flex items-center gap-2"><PhotoIcon size={18}/> Wedding Portfolio</span><ExternalLink size={16}/></a>
          <a href="/packages" className="flex min-h-11 items-center justify-between rounded-xl border border-amber-200/35 bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/20"><span className="inline-flex items-center gap-2"><Sparkles size={18}/> Photography Packages</span><ExternalLink size={16}/></a>
          <a href="/booking" className="flex min-h-11 items-center justify-between rounded-xl bg-amber-300 px-4 py-3 text-sm font-bold text-emerald-950 hover:bg-amber-200"><span className="inline-flex items-center gap-2"><HeartHandshake size={18}/> Plan Your Wedding</span><ExternalLink size={16}/></a>
        </div>
      </div>
      <div className="border-t border-white/15 bg-emerald-950/45 px-6 py-3 text-xs leading-5 text-emerald-100">This digital invitation experience was created with care by RamyaChobi.</div>
    </section>
  );
}

/**
 * This URL is an Adsterra Smartlink supplied by the site owner, not a native
 * banner script. It navigates only after an explicit click and exposes no
 * invitation fragment, booking data, admin token or customer information.
 *
 * Ads are shown only on the public marketing landing page; no third-party
 * scripts are loaded in personalized wedding guest pages.
 */
const ADSTERRA_DIRECT_LINK = 'https://auctionr.org/4/f1ca6bf0dd63f07aa3a116031c5ee6ad';

export function WeddingAdsterraSlot() {
  return (
    <aside aria-label="Sponsored external advertising" className="overflow-hidden rounded-2xl border border-amber-200 bg-white/90 p-5 text-stone-800 shadow-sm">
      <p className="text-[11px] font-extrabold uppercase tracking-[.17em] text-stone-500">Sponsored · External Ad</p>
      <div className="mt-3 rounded-xl border border-amber-100 bg-[#fcf5e6] p-4 text-left">
        <span className="text-xs font-semibold uppercase tracking-[.16em] text-amber-900">Advertisement</span>
        <h3 className="mt-2 font-serif text-xl text-[#193c32]">Explore Sponsored Offers</h3>
        <p className="mt-2 text-sm leading-6 text-stone-700">Optional offers from a third-party advertiser. Destination content can vary by visitor.</p>
        <a
          href={ADSTERRA_DIRECT_LINK}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          referrerPolicy="no-referrer"
          className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#193c32] px-4 py-3 text-center text-sm font-bold text-white hover:bg-emerald-900 focus-visible:outline-4 focus-visible:outline-amber-600"
        >
          Visit Sponsored Link <ExternalLink size={16} aria-hidden="true" />
        </a>
      </div>
      <p className="mt-3 text-xs leading-5 text-stone-600">You are leaving RamyaChobi. This link is an Adsterra Direct Link, not a RamyaChobi service or booking. No ad auto-redirects or pop-ups are used.</p>
    </aside>
  );
}
