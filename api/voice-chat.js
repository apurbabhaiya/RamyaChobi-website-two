const RATE_WINDOW_MS = 60000;
const recent = new Map();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://izfmwvqveiphyuufvxoq.supabase.co';
const SUPABASE_PUBLIC_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_pTtO1vQIUiYpwVUHWYbCeA_hug5Y7Hn';

function englishReply(question) {
  const q = question.toLowerCase();
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)[.! ]*$/.test(q))
    return 'Welcome to RamyaChobi! Are you interested in wedding photography, cinematography, or a casual photoshoot?';
  if (/book|reservation|confirm|date|availability|available/.test(q))
    return 'Please use our booking page to choose your event, location, date, and package. The team will verify availability and payment before confirming anything.';
  if (/price|cost|package|budget|how much|quote/.test(q))
    return 'We offer wedding, regular, and outdoor photography packages. Prices and approved discounts may change. Please see the current prices on our Packages page, or use the Booking page for a personalized estimate.';
  if (/discount|offer|promo/.test(q))
    return 'The currently approved package discount is shown in the Booking calculator. Our team must approve any additional discount.';
  if (/advance|deposit|payment|pay/.test(q))
    return 'Our booking page shows the applicable advance payment and installment details. Please submit a booking request; payment and final confirmation are verified by our team.';
  if (/portfolio|sample|previous work|gallery of work|show.*photo/.test(q))
    return 'You can explore our photography portfolio and event stories on the Portfolio page.';
  if (/gallery|download|delivery|my photos|face search/.test(q))
    return 'To see your private photographs or final delivery, use the Client Gallery or Delivery section. The assistant cannot access private customer galleries.';
  if (/photo|video|wedding|cinema|drone|holud|reception|birthday|event/.test(q))
    return 'RamyaChobi provides photography and cinematography for weddings, celebrations, outdoor sessions, and other events. You can explore the Packages and Portfolio pages to find a suitable option.';
  if (/contact|human|person|whatsapp|phone|call/.test(q))
    return 'You can contact our team through WhatsApp or by phone at 01776044951.';
  return 'I can help with wedding photography packages, booking requests, our portfolio, and final photo delivery. What would you like to know?';
}
function respond(res, status, data) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(data));
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return respond(res,405,{reply:'Method not allowed'});
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && host) {
    let sameHost = false;
    try { const parsed = new URL(origin); sameHost = parsed.protocol === 'https:' && parsed.host === host; }
    catch { sameHost = false; }
    if (!sameHost) return respond(res,403,{reply:'Origin not allowed'});
  }
  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].slice(0,80);
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter(t => now-t < RATE_WINDOW_MS);
  if (hits.length >= 12) return respond(res,429,{reply:'Please try again in a minute.'});
  recent.set(ip,[...hits,now]);
  if (recent.size > 1000) recent.clear();
  let data;
  try {
    if (req.body && typeof req.body === 'object') data = req.body;
    else {
      const chunks = [];
      let bytes=0;
      for await (const chunk of req) {
        const part=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
        bytes+=part.byteLength;
        if(bytes>8192) return respond(res,413,{reply:'Question is too long'});
        chunks.push(part);
      }
      data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
  } catch { return respond(res,400,{reply:'Invalid question'}); }
  const question=typeof data?.message==='string' ? data.message.trim() : '';
  if(!question || question.length>1200) return respond(res,400,{reply:'Please enter a shorter question.'});
  const english=data?.language==='en';
  const links=english
    ? [{label:'View packages',href:'/packages'},{label:'Booking and estimate',href:'/booking'},{label:'Portfolio',href:'/portfolio'}]
    : [{label:'প্যাকেজ দেখুন',href:'/packages'},{label:'বুকিং করুন',href:'/booking'},{label:'পোর্টফোলিও',href:'/portfolio'}];
  if(english) return respond(res,200,{reply:englishReply(question),links});
  try {
    const history=Array.isArray(data.history) ? data.history.filter(v=>typeof v==='string').slice(-8).map(v=>v.slice(0,1200)) : [];
    const upstream=await fetch(SUPABASE_URL+'/functions/v1/public-chat',{
      method:'POST',
      headers:{'Content-Type':'application/json',apikey:SUPABASE_PUBLIC_KEY},
      body:JSON.stringify({message:question,history}),
      signal:AbortSignal.timeout(8000),
    });
    const answer=await upstream.json().catch(()=>({}));
    if(!upstream.ok) throw new Error('Chat unavailable');
    const reply=typeof answer?.reply==='string'?answer.reply:'দুঃখিত, উত্তর পাওয়া যায়নি।';
    return respond(res,200,{reply,links:Array.isArray(answer?.links)?answer.links:links});
  } catch {
    return respond(res,503,{reply:'এই মুহূর্তে উত্তর পাওয়া যাচ্ছে না। অনুগ্রহ করে আবার চেষ্টা করুন অথবা WhatsApp-এ যোগাযোগ করুন।'});
  }
}
