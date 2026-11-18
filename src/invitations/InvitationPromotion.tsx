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
 * Reserved Adsterra Native Banner placement on the *public marketing page*.
 * It intentionally does not load unknown third-party code. The publisher's
 * approved, exact script/container pair must be configured and reviewed first.
 * Keep advertising code off guest invitations and all admin routes.
 */
export function WeddingAdsterraSlot() {
  return (
    <aside aria-label="Advertising information" className="rounded-2xl border border-dashed border-amber-300 bg-white/75 p-5 text-center text-stone-700">
      <div className="text-[11px] font-bold uppercase tracking-[.17em] text-stone-500">Advertising placement</div>
      <div id="ramyachobi-adsterra-native-slot" data-ad-provider="adsterra" data-ad-status="not-configured" className="mt-3 flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl bg-amber-50 p-3">
        <span className="font-serif text-lg text-emerald-900">Partner with RamyaChobi</span>
        <p className="text-xs leading-5">A small, clearly labeled native banner can appear here after publisher approval.</p>
      </div>
      <p className="mt-3 text-xs leading-5 text-stone-600">No third-party ad trackers are loaded in this preview. Adsterra integration requires an approved publisher code and a public, compliant hosting setup.</p>
    </aside>
  );
}
