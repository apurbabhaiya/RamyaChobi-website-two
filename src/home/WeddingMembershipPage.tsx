import React, { useEffect, useState } from 'react';
import { ArrowRight, BadgePercent, Check, CreditCard, Download, ShieldCheck, Sparkles, Share2, Copy, LoaderCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import ClientPageShell, { clientFocus } from './ClientPageShell';

type MembershipPackage = { name: string; regular: number; discount: number; member: number };
type MembershipCardData = { membership_number:number; membership_code:string; client_name:string; selected_package:string|null; amount:number; issued_at:string };
const packages: MembershipPackage[] = [
  { name:'Hindu Groom', regular:36000, discount:1800, member:34200 },
  { name:'Hindu Bride', regular:28000, discount:1400, member:26600 },
  { name:'Muslim Groom', regular:20000, discount:1000, member:19000 },
  { name:'Muslim Bride', regular:16000, discount:800, member:15200 },
];
const money=(n:number)=>'৳'+n.toLocaleString('en-US');
const API='/api/zinipay-membership';
const CARD_API='/api/membership-card';

function MembershipCard({data}:{data:MembershipCardData}) {
  function download() {
    const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:[100,63]});
    pdf.setFillColor(25,62,50);pdf.rect(0,0,100,63,'F');
    pdf.setDrawColor(233,217,173);pdf.setLineWidth(.8);pdf.roundedRect(4,4,92,55,3,3,'S');
    pdf.setTextColor(233,217,173);pdf.setFont('helvetica','bold');pdf.setFontSize(8);pdf.text('RAMYACHOBI',9,13);
    pdf.setTextColor(255,255,255);pdf.setFontSize(13);pdf.text('MEMBERSHIP CARD',9,23);
    pdf.setFontSize(9);pdf.text('MEMBER NO.',9,33);pdf.setFontSize(19);pdf.text(String(data.membership_number).padStart(3,'0'),9,43);
    pdf.setFontSize(8);pdf.text(data.client_name.slice(0,32),9,51);
    pdf.setTextColor(233,217,173);pdf.setFontSize(7);pdf.text(data.membership_code,9,56);
    pdf.save('RamyaChobi-Membership-'+data.membership_number+'.pdf');
  }
  return <section className="mt-7 rounded-3xl border border-[#d9c69b] bg-white p-5 shadow-sm sm:p-8">
    <div className="flex items-center gap-2 text-emerald-800"><ShieldCheck/><b>Payment successful — membership activated</b></div>
    <p className="mt-2 text-sm text-stone-600">Your membership card is ready. Save it to your phone or keep the card link for future access.</p>
    <div id="ramyachobi-membership-card" className="relative mt-6 mx-auto max-w-xl overflow-hidden rounded-3xl border border-[#e9d9ad] bg-[#193e32] p-6 text-white shadow-2xl sm:p-8">
      <div className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full border-[18px] border-[#e9d9ad]/10"/>
      <div className="relative flex items-start justify-between gap-3"><div><p className="text-xs font-bold tracking-[.25em] text-[#e9d9ad]">RAMYACHOBI</p><p className="mt-1 text-[10px] tracking-[.22em] text-emerald-100">PHOTOGRAPHY & CINEMATOGRAPHY</p></div><span className="rounded-full border border-[#e9d9ad]/50 px-3 py-1 text-[10px] font-bold text-[#e9d9ad]">OFFICIAL MEMBER</span></div>
      <p className="relative mt-8 text-xs tracking-[.2em] text-emerald-100">MEMBERSHIP CARD</p>
      <div className="relative mt-1 flex items-end justify-between gap-4"><div><p className="text-5xl font-black tracking-tight">{String(data.membership_number).padStart(3,'0')}</p><p className="mt-2 text-sm font-semibold">{data.client_name}</p><p className="mt-1 text-xs text-emerald-100">{data.membership_code}</p></div><div className="text-right"><p className="text-[10px] text-emerald-100">MEMBER SINCE</p><p className="mt-1 text-sm font-bold">{new Date(data.issued_at).toLocaleDateString('en-GB')}</p><p className="mt-3 text-[10px] text-[#e9d9ad]">5% WEDDING PACKAGE DISCOUNT</p></div></div>
      <div className="relative mt-6 border-t border-[#e9d9ad]/30 pt-3 text-[10px] tracking-widest text-[#e9d9ad]">A MOMENT. A MEMORY. A STORY.</div>
    </div>
    <div className="mt-5 flex flex-wrap justify-center gap-3"><button onClick={download} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#193e32] px-5 py-3 font-bold text-white"><Download size={17}/>Download Membership Card</button><button onClick={()=>navigator.clipboard?.writeText(window.location.href)} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#d9c69b] px-5 py-3 font-bold text-[#193e32]"><Copy size={16}/>Copy Card Link</button></div>
  </section>;
}

function MembershipPaymentForm({onCard}:{onCard:(token:string)=>void}) {
  const [name,setName]=useState(''),[phone,setPhone]=useState(''),[selectedPackage,setSelectedPackage]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(e:React.FormEvent) {
    e.preventDefault();setError('');
    if(name.trim().length<2||phone.trim().length<7){setError('Please enter your full name and valid mobile number.');return;}
    setBusy(true);
    try {
      const r=await fetch(API+'?action=create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:name.trim(),phone:phone.trim(),selectedPackage:selectedPackage||null})});
      const data=await r.json();if(!r.ok||!data.paymentUrl)throw new Error(data.error||'Could not start ZiniPay checkout.');
      window.location.assign(data.paymentUrl);
    } catch(e:any){setError(e?.message||'Payment could not be started. Please try again.');setBusy(false);}
  }
  return <section id="membership-payment" className="mt-10 scroll-mt-24 rounded-3xl border border-[#d9c69b] bg-white p-5 shadow-sm sm:p-8">
    <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#193e32] text-[#e9d9ad]"><CreditCard size={24}/></span><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#8a6740]">Secure online checkout</p><h2 className="font-serif text-2xl font-bold text-[#193e32] sm:text-3xl">Get Your Membership Card · ৳99</h2></div></div>
    <div className="mt-5 rounded-2xl bg-[#f8f6ef] p-4 text-sm leading-6 text-stone-700">Pay securely through ZiniPay. After payment is confirmed, your membership number and digital card will appear automatically. You can download the card as a PDF.</div>
    <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-stone-700">Full name *<input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-3 font-normal" placeholder="Enter your name"/></label>
      <label className="text-sm font-semibold text-stone-700">Mobile number *<input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-3 font-normal" placeholder="01XXXXXXXXX"/></label>
      <label className="text-sm font-semibold text-stone-700 sm:col-span-2">Wedding package (optional)<select value={selectedPackage} onChange={e=>setSelectedPackage(e.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 font-normal"><option value="">Choose later</option>{packages.map(p=><option key={p.name} value={p.name}>{p.name} · Member price {money(p.member)}</option>)}</select></label>
      {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
      <button disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#193e32] px-5 py-3 font-bold text-white disabled:opacity-60 sm:col-span-2">{busy?<><LoaderCircle className="animate-spin" size={17}/>Connecting to ZiniPay…</>:'Pay ৳99 with ZiniPay'}</button>
    </form>
    <p className="mt-4 text-xs text-stone-500">Your card is issued only after server-side payment verification. Never share your wallet PIN or OTP.</p>
  </section>;
}

export default function WeddingMembershipPage() {
  const [cardToken,setCardToken]=useState<string|null>(null),[card,setCard]=useState<MembershipCardData|null>(null),[status,setStatus]=useState(''),[copyState,setCopyState]=useState(false);
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const token=params.get('card');
    if(token){setCardToken(token);return;}
    const reference=params.get('reference');
    if(params.get('payment')==='return'&&reference){
      setStatus('Verifying your payment…');
      fetch(API+'?action=verify&reference='+encodeURIComponent(reference)).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Payment verification failed.');if(d.cardToken){setCardToken(d.cardToken);window.history.replaceState({},'',window.location.pathname+'?card='+encodeURIComponent(d.cardToken));}else setStatus('Your payment is still processing. This page will check again shortly.');}).catch(e=>setStatus(e.message||'Could not verify payment.'));
    } else if(params.get('payment')==='cancel') setStatus('Payment was cancelled. You can try again whenever you are ready.');
  },[]);
  useEffect(()=>{
    if(!cardToken)return;
    let active=true;
    fetch(CARD_API+'?token='+encodeURIComponent(cardToken)).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Card not found.');if(active)setCard(d);}).catch(e=>{if(active)setStatus(e.message);});
    return()=>{active=false;};
  },[cardToken]);
  async function share(){try{await navigator.clipboard.writeText(window.location.href);setCopyState(true);}catch{setCopyState(false);}}
  const shareUrl=typeof window!=='undefined'?window.location.href:'https://ramyachobi-website-two.vercel.app/wedding-membership';
  const facebookShare='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(shareUrl);
  return <ClientPageShell current="membership"><main id="page-content" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-10">
    <section className="relative overflow-hidden rounded-[2rem] bg-[#193e32] px-5 py-8 text-white shadow-xl sm:px-9 sm:py-11"><div className="relative"><p className="inline-flex items-center gap-2 rounded-full border border-[#e9d9ad]/40 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.17em] text-[#f0dfb6]"><Sparkles size={14}/> RAMYACHOBI MEMBERSHIP</p><h1 className="mt-5 max-w-3xl font-serif text-3xl font-bold leading-tight sm:text-5xl">Your Moments. Your Membership.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-base">Become a RamyaChobi member and enjoy an exclusive 5% discount on wedding photography packages.</p><div className="mt-7 flex flex-col gap-3 rounded-2xl border border-[#e9d9ad]/35 bg-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">One-time membership fee</p><p className="mt-1 text-3xl font-extrabold">৳99</p></div><p className="text-sm text-emerald-50 sm:max-w-xs sm:text-right">Your unique membership number and digital card are generated after successful payment.</p></div><div className="mt-6 flex flex-wrap gap-3"><a href="#membership-packages" className={'inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#e9d9ad] px-5 py-3 text-sm font-extrabold text-[#193e32] '+clientFocus}>Explore Member Prices <ArrowRight size={17}/></a><a href="#membership-payment" className={'inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-bold text-white '+clientFocus}>Get Membership <CreditCard size={17}/></a><a href={facebookShare} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-bold text-white"><Share2 size={17}/>Share</a><button onClick={share} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-bold text-white"><Copy size={16}/>{copyState?'Copied':'Copy Link'}</button></div></div></section>
    {status&&<p role="status" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{status}</p>}
    {card&&<MembershipCard data={card}/>}
    {cardToken&&!card&&<div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-white p-6 text-sm text-stone-600"><LoaderCircle className="animate-spin"/> Loading your membership card…</div>}
    {!cardToken&&!status.includes('Verifying')&&<><section id="membership-packages" className="scroll-mt-24 pt-9 sm:pt-12"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#8a6740]">MEMBERSHIP OFFERS</p><h2 className="mt-2 font-serif text-3xl font-bold text-[#193e32] sm:text-4xl">Choose Your Wedding Package</h2><p className="mt-2 text-sm text-stone-600">All four packages include a 5% membership discount.</p></div><span className="inline-flex items-center gap-2 rounded-full bg-[#e8efe8] px-4 py-2 text-sm font-extrabold text-[#193e32]"><BadgePercent size={18}/> Save 5%</span></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{packages.map(p=><article key={p.name} className="overflow-hidden rounded-3xl border border-[#d9c69b] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-bold tracking-wider text-[#8a6740]">WEDDING PACKAGE</span><span className="rounded-full bg-[#e8efe8] px-3 py-1 text-xs font-extrabold text-[#193e32]">5% OFF</span></div><h3 className="mt-4 font-serif text-2xl font-bold text-[#193e32]">{p.name}</h3><p className="mt-4 text-sm text-stone-500">Regular price <span className="ml-2 line-through">{money(p.regular)}</span></p><p className="mt-1 text-sm text-emerald-800">You save {money(p.discount)}</p><p className="mt-4 rounded-2xl bg-[#193e32] p-4 text-2xl font-black text-white">Member price {money(p.member)}</p><button onClick={()=>{document.getElementById('membership-payment')?.scrollIntoView({behavior:'smooth'});}} className="mt-4 w-full rounded-xl bg-[#b18b57] px-4 py-3 font-bold text-[#193e32]">Get Membership <ArrowRight className="ml-2 inline" size={16}/></button></article>)}</div></section><MembershipPaymentForm onCard={setCardToken}/></>}
    <p className="mt-6 text-center text-xs leading-6 text-stone-500">Prices are displayed in Bangladeshi Taka (BDT). Membership card fee: ৳99. RamyaChobi membership gives 5% off eligible wedding photography packages.</p>
  </main></ClientPageShell>;
}
