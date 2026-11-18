import React, { useState } from 'react';
import { ArrowRight, BadgePercent, Camera, Check, Copy, CreditCard, Share2, Sparkles } from 'lucide-react';
import ClientPageShell, { clientFocus } from './ClientPageShell';

type MembershipPackage = {
  name: string;
  regular: number;
  discount: number;
  member: number;
};

const packages: MembershipPackage[] = [
  { name: 'Hindu Groom', regular: 36000, discount: 1800, member: 34200 },
  { name: 'Hindu Bride', regular: 28000, discount: 1400, member: 26600 },
  { name: 'Muslim Groom', regular: 20000, discount: 1000, member: 19000 },
  { name: 'Muslim Bride', regular: 16000, discount: 800, member: 15200 },
];

const money = (amount: number) => '৳' + amount.toLocaleString('en-US');
const publicUrl = 'https://ramyachobi-website-two.vercel.app/wedding-membership';

function PackageCard({ item }: { item: MembershipPackage }) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#d9c69b] bg-white shadow-[0_12px_32px_rgba(25,62,50,.08)]">
      <div className="h-1.5 bg-gradient-to-r from-[#193e32] via-[#b18b57] to-[#193e32]" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-[#f5f0e4] px-3 py-1.5 text-xs font-bold tracking-wide text-[#6d512e]">WEDDING PACKAGE</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e8efe8] px-3 py-1.5 text-xs font-extrabold text-[#193e32]"><BadgePercent size={15}/> 5% OFF</span>
        </div>
        <h2 className="mt-5 font-serif text-2xl font-bold text-[#193e32]">{item.name}</h2>
        <div className="mt-5 rounded-2xl bg-[#f8f6ef] p-4">
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-stone-500">Regular Price</p>
          <p className="mt-1 text-xl font-semibold text-stone-400 line-through decoration-2">{money(item.regular)}</p>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-dashed border-stone-300 pt-3">
            <span className="text-sm font-medium text-stone-600">5% Membership Discount</span>
            <span className="font-bold text-emerald-800">−{money(item.discount)}</span>
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-[#193e32] p-5 text-white shadow-[0_8px_18px_rgba(25,62,50,.18)]">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#e9d9ad]">Member Price</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{money(item.member)}</p>
          <p className="mt-2 flex items-center gap-2 text-xs text-emerald-50"><Check size={15}/> You save {money(item.discount)}</p>
        </div>
        <a href="/booking" className={'mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#b18b57] px-4 py-3 text-sm font-bold text-[#193e32] transition hover:bg-[#c7a66f] '+clientFocus}>
          Booking / Enquiry <ArrowRight size={17}/>
        </a>
      </div>
    </article>
  );
}

export default function WeddingMembershipPage() {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  async function copyPageLink() {
    const link = typeof window !== 'undefined' ? window.location.href : publicUrl;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const input = document.createElement('textarea');
        input.value = link;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand('copy');
        input.remove();
        if (!copied) throw new Error('Copy not supported');
      }
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : publicUrl;
  const facebookShare = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl);

  return (
    <ClientPageShell current="membership">
      <main id="page-content" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-10">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#193e32] px-5 py-8 text-white shadow-[0_18px_45px_rgba(25,62,50,.16)] sm:px-9 sm:py-11">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[26px] border-[#e9d9ad]/10"/>
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full border-[20px] border-white/5"/>
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#e9d9ad]/40 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.17em] text-[#f0dfb6]"><Sparkles size={14}/> RAMYACHOBI MEMBERSHIP</p>
            <h1 className="mt-5 max-w-3xl font-serif text-3xl font-bold leading-tight sm:text-5xl">Wedding Package – 5% Membership Discount</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-base">Choose your wedding package and see the special member price. Compare the regular price, 5% discount and final member price clearly.</p>
            <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-[#e9d9ad]/35 bg-white/10 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e9d9ad] text-[#193e32]"><CreditCard size={25}/></span>
                <div><p className="text-xs font-semibold uppercase tracking-[.12em] text-emerald-100">Membership Card Fee</p><p className="mt-0.5 text-2xl font-extrabold text-white">৳99</p></div>
              </div>
              <div className="text-sm leading-6 text-emerald-50 sm:max-w-xs sm:text-right">Membership price is shown separately for each wedding package below.</div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#membership-packages" className={'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#e9d9ad] px-5 py-3 text-sm font-extrabold text-[#193e32] '+clientFocus}>View 4 Packages <ArrowRight size={17}/></a>
              <a href={facebookShare} target="_blank" rel="noopener noreferrer" className={'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15 '+clientFocus}><Share2 size={17}/> Share on Facebook</a>
              <button type="button" onClick={copyPageLink} className={'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15 '+clientFocus}><Copy size={16}/>{copyState==='copied'?'Link Copied':copyState==='error'?'Copy unavailable':'Copy Link'}</button>
            </div>
          </div>
        </section>

        <section id="membership-packages" className="scroll-mt-24 pt-9 sm:pt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#8a6740]">MEMBERSHIP OFFERS</p><h2 className="mt-2 font-serif text-3xl font-bold text-[#193e32] sm:text-4xl">Choose Your Wedding Package</h2><p className="mt-2 text-sm leading-7 text-stone-600">All four packages include a 5% membership discount.</p></div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#e8efe8] px-4 py-2 text-sm font-extrabold text-[#193e32]"><BadgePercent size={18}/> Save 5%</span>
          </div>
          <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2">
            {packages.map(item=><PackageCard key={item.name} item={item}/>)}
          </div>
        </section>

        <section className="mt-9 grid gap-4 md:grid-cols-[1fr_auto] md:items-center rounded-3xl border border-[#d9c69b] bg-white p-5 sm:p-7">
          <div><h2 className="font-serif text-2xl font-bold text-[#193e32]">Ready to plan your wedding?</h2><p className="mt-2 text-sm leading-7 text-stone-600">Contact RamyaChobi to discuss your package, event date and booking details.</p></div>
          <a href="/booking" className={'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#193e32] px-5 py-3 text-sm font-bold text-white '+clientFocus}>Booking / Enquiry <ArrowRight size={17}/></a>
        </section>

        <p className="mt-6 text-center text-xs leading-6 text-stone-500">Prices are displayed in Bangladeshi Taka (BDT). Membership Card Fee: ৳99. Please confirm package details and availability with RamyaChobi before booking.</p>
      </main>
    </ClientPageShell>
  );
}
