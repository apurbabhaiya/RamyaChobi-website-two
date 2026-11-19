import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import {
  CalendarDays, Camera, Check, ChevronRight, Copy, ExternalLink, Eye, Heart,
  ImagePlus, Link2, LogIn, LogOut, MapPin, Plus, RefreshCw, Save, Search,
  Send, Settings2, ShieldCheck, Trash2, Users, X
} from "lucide-react";

const db = supabase as any;
const TOKEN_KEY = "ramya_booking_admin_token_v1";
const moneylessDate = (v: string) => v ? new Date(v + "T00:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) : "";
const input = "w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-amber-700";
const btn = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition";
const themes: Record<string,string> = {
  "ivory-gold":"bg-[#f8f3e9] text-[#5a4527]",
  "maroon-gold":"bg-[#4b1525] text-[#f6e7c5]",
  "charcoal-gold":"bg-[#171717] text-[#f3dfb1]",
  "rose-ivory":"bg-[#f8e9e8] text-[#6d343c]"
};
const themeLabel: Record<string,string> = {"ivory-gold":"Ivory & Gold","maroon-gold":"Maroon & Gold","charcoal-gold":"Charcoal & Gold","rose-ivory":"Rose & Ivory"};
const blankClient = {client_name:"",bride_name:"",bride_name_bn:"",groom_name:"",groom_name_bn:"",phone:"",email:"",address:"",notes:"",booking_id:""};
const blankInvitation = {client_id:"",slug:"",title:"Wedding Invitation",title_bn:"বিবাহের আমন্ত্রণ",welcome_message:"With the blessings of our families, we invite you to celebrate our special day.",welcome_message_bn:"পরিবারের আশীর্বাদে আমাদের বিশেষ দিনে আপনাকে সাদর আমন্ত্রণ জানাই।",cover_image_url:"",couple_photo_url:"",theme:"ivory-gold",rsvp_deadline:"",dress_code:"",dress_code_bn:"",gallery_images:[] as string[],show_countdown:true,status:"draft"};
const blankEvent = {invitation_id:"",event_type:"wedding",title:"Wedding Ceremony",title_bn:"বিবাহ অনুষ্ঠান",event_date:"",start_time:"",end_time:"",venue:"",venue_bn:"",address:"",address_bn:"",maps_url:"",notes:"",notes_bn:"",sort_order:0};
const blankGuest = {invitation_id:"",guest_name:"",phone:"",email:"",side:"both",group_name:"",max_attendees:1};

function useAdminToken() {
  const [token,setToken] = useState("");
  const [ready,setReady] = useState(false);
  const [code,setCode] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  useEffect(()=>{setToken(localStorage.getItem(TOKEN_KEY)||"");setReady(true)},[]);
  const login = async (e:React.FormEvent) => {
    e.preventDefault(); setBusy(true);setError("");
    try {
      const {data,error}=await db.rpc("booking_admin_login",{p_code:code.trim()});
      if(error) throw error;
      if(!data?.token) throw new Error("Admin access was not granted.");
      localStorage.setItem(TOKEN_KEY,data.token);setToken(data.token);setCode("");
    } catch(e:any){setError(e?.message||"Could not sign in.");}
    finally{setBusy(false)}
  };
  const logout = async()=>{try{if(token) await db.rpc("booking_admin_logout",{p_token:token})}catch{} localStorage.removeItem(TOKEN_KEY);setToken("")};
  return {token,ready,code,setCode,busy,error,login,logout};
}

function InvitationPublic({slug}:{slug:string}) {
  const [guestToken,setGuestToken] = useState("");
  const [language,setLanguage] = useState<"both"|"en"|"bn">("both");
  const [data,setData] = useState<any>(null);
  const [loading,setLoading] = useState(true);
  const [attendance,setAttendance] = useState("attending");
  const [count,setCount] = useState(1);
  const [guestName,setGuestName] = useState("");
  const [phone,setPhone] = useState("");
  const [email,setEmail] = useState("");
  const [message,setMessage] = useState("");
  const [selectedEvent,setSelectedEvent] = useState("");
  const [notice,setNotice] = useState("");
  const [sending,setSending] = useState(false);
  const [comments,setComments] = useState<any[]>([]);
  const [commentName,setCommentName] = useState("");
  const [commentText,setCommentText] = useState("");
  const [commentSending,setCommentSending] = useState(false);
  useEffect(()=>{
    const q=new URLSearchParams(window.location.search);const t=q.get("guest")||"";setGuestToken(t);
    let live=true;
    db.rpc("get_wedding_invitation",{p_slug:slug,p_guest_token:t||null}).then(({data,error}:any)=>{
      if(!live)return;if(error) setNotice(error.message);else if(!data)setNotice("This invitation is not available.");else {setData(data);if(data.guest){setGuestName(data.guest.guest_name);setCount(data.guest.attending_count||1);setAttendance(data.guest.rsvp_status==="not_attending"?"not_attending":"attending")}}
    }).finally(()=>live&&setLoading(false));
    return()=>{live=false};
  },[slug]);
  useEffect(()=>{let live=true;db.rpc("get_wedding_invitation_comments",{p_slug:slug}).then(({data,error}:any)=>{if(live&&!error)setComments(Array.isArray(data)?data:[])});return()=>{live=false}},[slug]);
  useEffect(()=>{if(!data?.invitation)return;const i=data.invitation;document.title=`${i.bride_name||"Bride"} & ${i.groom_name||"Groom"} Wedding Invitation | RamyaChobi`;const desc=(i.welcome_message||"View the wedding invitation, event details and RSVP.").slice(0,155);let meta=document.querySelector('meta[name="description"]') as HTMLMetaElement|null;if(!meta){meta=document.createElement("meta");meta.name="description";document.head.appendChild(meta)}meta.content=desc;let canonical=document.querySelector('link[rel="canonical"]') as HTMLLinkElement|null;if(!canonical){canonical=document.createElement("link");canonical.rel="canonical";document.head.appendChild(canonical)}canonical.href=window.location.href.split("?")[0];const put=(property:string,content:string)=>{let el=document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement|null;if(!el){el=document.createElement("meta");el.setAttribute("property",property);document.head.appendChild(el)}el.content=content};put("og:title",document.title);put("og:description",desc);put("og:url",canonical.href);put("og:type","website");if(i.cover_image_url)put("og:image",i.cover_image_url);const schema={'@context':"https://schema.org",'@type':"Event",name:`${i.bride_name||"Bride"} & ${i.groom_name||"Groom"} Wedding`,description:desc,url:canonical.href,image:i.cover_image_url||undefined,startDate:data.events?.[0]?.event_date||undefined,organizer:{'@type':"Organization",name:"RamyaChobi"}};let ld=document.getElementById("ramya-invitation-schema");if(!ld){ld=document.createElement("script");ld.id="ramya-invitation-schema";ld.setAttribute("type","application/ld+json");document.head.appendChild(ld)}ld.textContent=JSON.stringify(schema)},[data]);
  const submitComment=async(e:React.FormEvent)=>{e.preventDefault();setCommentSending(true);setNotice("");try{const {data:result,error}=await db.rpc("submit_wedding_invitation_comment",{p_slug:slug,p_guest_name:commentName,p_message:commentText,p_website:""});if(error)throw error;setNotice(result?.message||"Thank you. Your wish is awaiting approval.");setCommentName("");setCommentText("")}catch(e:any){setNotice(e?.message||"Could not submit your wish.")}finally{setCommentSending(false)}};
  const submit = async(e:React.FormEvent)=>{
    e.preventDefault();setSending(true);setNotice("");
    try{
      const {data,error}=await db.rpc("submit_wedding_invitation_rsvp",{
        p_slug:slug,p_guest_token:guestToken||null,p_guest_name:guestName,p_phone:phone,p_email:email,
        p_attendance:attendance,p_attendee_count:attendance==="attending"?count:0,p_message:message,p_event_id:selectedEvent||null
      });
      if(error)throw error;setNotice(data?.message||"Thank you for your response.");
    }catch(e:any){setNotice(e?.message||"Could not submit your RSVP.")}
    finally{setSending(false)}
  };
  if(loading)return <div className="min-h-screen grid place-items-center bg-[#f8f3e9] text-stone-600"><RefreshCw className="animate-spin"/></div>;
  if(!data)return <div className="min-h-screen grid place-items-center bg-[#f8f3e9] p-6 text-center"><div><Heart className="mx-auto mb-4 text-amber-700"/><h1 className="font-serif text-3xl">Invitation unavailable</h1><p className="mt-2 text-stone-500">{notice}</p><a className="mt-5 inline-block underline" href="/">RamyaChobi</a></div></div>;
  const i=data.invitation, c=data.invitation, t=themes[i.theme]||themes["ivory-gold"];
  return <main className={"min-h-screen "+t}>
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-12">
      <div className="mb-4 flex justify-end gap-1 rounded-full border border-[#b69a64]/40 bg-white/60 p-1 text-xs"><button onClick={()=>setLanguage("both")} className={"rounded-full px-3 py-1.5 "+(language==="both"?"bg-[#80663c] text-white":"")}>English + বাংলা</button><button onClick={()=>setLanguage("en")} className={"rounded-full px-3 py-1.5 "+(language==="en"?"bg-[#80663c] text-white":"")}>English</button><button onClick={()=>setLanguage("bn")} className={"rounded-full px-3 py-1.5 "+(language==="bn"?"bg-[#80663c] text-white":"")}>বাংলা</button></div>
      <div className="overflow-hidden rounded-[2rem] border border-current/10 bg-white/30 shadow-2xl shadow-black/10">
        {i.cover_image_url&&<img src={i.cover_image_url} alt="Wedding cover" className="h-64 w-full object-cover sm:h-[420px]"/>}
        <div className="px-6 py-10 text-center sm:px-14 sm:py-16">
          {language!=="bn"&&<p className="text-xs uppercase tracking-[.35em] opacity-70">Together with our families</p>}{language!=="en"&&<p className="mt-2 text-sm">পরিবারের সঙ্গে</p>}
          <div className="my-5 flex items-center justify-center gap-3"><span className="h-px w-12 bg-current/40"/><Heart size={18}/><span className="h-px w-12 bg-current/40"/></div>
          <h1 className="font-serif text-4xl leading-tight sm:text-6xl">{language!=="bn"?(i.bride_name||"Bride"):null}{language==="both"&&i.bride_name_bn?" · ":""}{language!=="en"?(i.bride_name_bn||"কনে"):null}<span className="block py-2 text-2xl italic opacity-70">&</span>{language!=="bn"?(i.groom_name||"Groom"):null}{language==="both"&&i.groom_name_bn?" · ":""}{language!=="en"?(i.groom_name_bn||"বর"):null}</h1>
          {language!=="bn"&&<p className="mt-6 font-serif text-xl sm:text-2xl">{i.title}</p>}{language!=="en"&&<p className="mt-2 font-serif text-xl sm:text-2xl">{i.title_bn||"বিবাহের আমন্ত্রণ"}</p>}
          {language!=="bn"&&<p className="mx-auto mt-5 max-w-xl text-sm leading-7 opacity-80">{i.welcome_message}</p>}{language!=="en"&&<p className="mx-auto mt-3 max-w-xl text-sm leading-7 opacity-80">{i.welcome_message_bn||"পরিবারের আশীর্বাদে আমাদের বিশেষ দিনে আপনাকে সাদর আমন্ত্রণ জানাই।"}</p>}
          {i.couple_photo_url&&<img src={i.couple_photo_url} alt="The couple" className="mx-auto mt-8 max-h-[440px] w-full rounded-2xl object-cover shadow-xl"/>}
          {i.show_countdown&&data.events?.[0]&&<div className="mt-8"><p className="text-xs uppercase tracking-[.25em] opacity-70">Save the date</p><p className="mt-2 font-serif text-2xl">{moneylessDate(data.events[0].event_date)}</p></div>}
        </div>
      </div>
      <section className="py-12">
        <h2 className="mb-6 text-center font-serif text-3xl">{language==="bn"?"বিয়ের আয়োজন":"Wedding Celebrations"}{language==="both"?" · বিয়ের আয়োজন":""}</h2>
        <div className="grid gap-4 sm:grid-cols-2">{(data.events||[]).map((e:any)=><article key={e.id} className="rounded-2xl border border-current/15 bg-white/35 p-5">
          <p className="text-xs uppercase tracking-widest opacity-60">{e.event_type}</p>{language!=="bn"&&<h3 className="mt-2 font-serif text-2xl">{e.title}</h3>}{language!=="en"&&<h3 className="mt-2 font-serif text-2xl">{e.title_bn||e.title}</h3>}
          <p className="mt-3 flex items-center gap-2 text-sm"><CalendarDays size={15}/>{moneylessDate(e.event_date)}</p>
          {e.start_time&&<p className="mt-1 text-sm">{e.start_time.slice(0,5)}{e.end_time?" – "+e.end_time.slice(0,5):""}</p>}
          {e.venue&&<p className="mt-2 flex items-start gap-2 text-sm"><MapPin size={15} className="mt-0.5 shrink-0"/>{language!=="bn"&&<span>{e.venue}{e.address?", "+e.address:""}</span>}{language!=="en"&&<span>{e.venue_bn||e.venue}{(e.address_bn||e.address)?", "+(e.address_bn||e.address):""}</span>}</p>}
          {e.maps_url&&<a className="mt-3 inline-flex items-center gap-1 text-sm underline" href={e.maps_url} target="_blank" rel="noreferrer">Open location <ExternalLink size={13}/></a>}
          {e.notes&&<div className="mt-3 text-sm opacity-70">{language!=="bn"&&<p>{e.notes}</p>}{language!=="en"&&<p>{e.notes_bn||e.notes}</p>}</div>}
        </article>)}</div>
      </section>
      {i.gallery_images?.length>0&&<section className="pb-12"><h2 className="mb-5 text-center font-serif text-3xl">Our Moments</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{i.gallery_images.map((url:string,n:number)=><img key={n} src={url} alt={"Wedding memory "+(n+1)} className="aspect-[3/4] w-full rounded-xl object-cover"/>)}</div></section>}
      {i.dress_code&&<div className="pb-8 text-center text-sm">{language!=="bn"&&<>Dress code: <strong>{i.dress_code}</strong></>}{language!=="en"&&<p>পোশাক: <strong>{i.dress_code_bn||i.dress_code}</strong></p>}</div>}
      <section className="rounded-[2rem] bg-white/60 p-6 text-stone-800 shadow-xl sm:p-10">
        <h2 className="text-center font-serif text-3xl">{language==="bn"?"আপনার উপস্থিতি নিশ্চিত করুন":"Kindly Respond"}{language==="both"?" · আপনার উপস্থিতি নিশ্চিত করুন":""}</h2><p className="mt-2 text-center text-sm text-stone-500">{language==="bn"?"অনুষ্ঠানে উপস্থিত থাকতে পারবেন কি না জানাবেন।":"Please let us know if you can join our celebration."}</p>
        <form onSubmit={submit} className="mx-auto mt-7 max-w-md space-y-4">
          <label className="block text-sm font-medium">Your name / আপনার নাম<input required className={input+" mt-1"} value={guestName} onChange={e=>setGuestName(e.target.value)} readOnly={!!data.guest}/></label>
          {!guestToken&&<><label className="block text-sm font-medium">Phone number / ফোন নম্বর<input required className={input+" mt-1"} value={phone} onChange={e=>setPhone(e.target.value)} /></label><label className="block text-sm font-medium">Email (optional) / ইমেইল (ঐচ্ছিক)<input className={input+" mt-1"} type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label></>}
          <label className="block text-sm font-medium">Will you attend? / আপনি কি উপস্থিত থাকবেন?<select className={input+" mt-1"} value={attendance} onChange={e=>setAttendance(e.target.value)}><option value="attending">Joyfully accept</option><option value="not_attending">Regretfully decline</option></select></label>
          {(data.events||[]).length>0&&<label className="block text-sm font-medium">Which event? / কোন অনুষ্ঠানে?<select className={input+" mt-1"} value={selectedEvent} onChange={e=>setSelectedEvent(e.target.value)}><option value="">All events / সব অনুষ্ঠান</option>{data.events.map((ev:any)=><option key={ev.id} value={ev.id}>{ev.title} / {ev.title_bn||ev.title}</option>)}</select></label>}{attendance==="attending"&&<label className="block text-sm font-medium">Number of attendees / অতিথির সংখ্যা<input type="number" min="1" max={data.guest?.max_attendees||20} className={input+" mt-1"} value={count} onChange={e=>setCount(Number(e.target.value))}/></label>}
          <label className="block text-sm font-medium">Message (optional) / বার্তা (ঐচ্ছিক)<textarea rows={3} className={input+" mt-1"} value={message} onChange={e=>setMessage(e.target.value)}/></label>
          <button disabled={sending} className={btn+" w-full bg-stone-900 text-white disabled:opacity-50"}><Send size={16}/>{sending?"Sending…":"Send RSVP / উত্তর পাঠান"}</button>
          {notice&&<p role="status" className="rounded-xl bg-amber-50 p-3 text-center text-sm text-amber-900">{notice}</p>}
        </form>
      </section>
      <section className="mt-12 rounded-[2rem] border border-[#b69a64]/40 bg-white/65 p-6 shadow-lg sm:p-9"><div className="text-center"><p className="text-xs uppercase tracking-[.28em] text-amber-800">Share your wishes</p><h2 className="mt-2 font-serif text-3xl">Guest Wishes · শুভেচ্ছা</h2><p className="mt-2 text-sm text-stone-600">Leave a kind message for the couple. Messages appear after review.</p></div><form onSubmit={submitComment} className="mx-auto mt-6 max-w-lg space-y-3"><input required maxLength={120} className={input} placeholder="Your name / আপনার নাম" value={commentName} onChange={e=>setCommentName(e.target.value)}/><textarea required minLength={2} maxLength={500} rows={3} className={input} placeholder="Write your wishes / শুভেচ্ছা লিখুন" value={commentText} onChange={e=>setCommentText(e.target.value)}/><button disabled={commentSending} className={btn+" w-full bg-[#80663c] text-white"}><Send size={15}/>{commentSending?"Submitting…":"Submit wishes / শুভেচ্ছা পাঠান"}</button></form><div className="mx-auto mt-8 max-w-2xl space-y-3">{comments.map((c:any)=><article key={c.id} className="rounded-xl border border-[#b69a64]/25 bg-[#fbf8f1] p-4"><p className="font-semibold">{c.guest_name}</p><p className="mt-1 text-sm leading-6 text-stone-700">{c.message}</p></article>)}{!comments.length&&<p className="text-center text-sm text-stone-500">Be the first to leave a wish.</p>}</div></section>
      <footer className="py-10 text-center text-xs opacity-60">Invitation crafted with love by <a className="font-semibold underline" href="/">RamyaChobi</a></footer>
    </div>
  </main>;
}

export default function WeddingInvitationPortal(){
  const slug=decodeURIComponent(window.location.pathname.split("/").filter(Boolean).pop()||"");
  if(window.location.pathname.startsWith("/invite/"))return <InvitationPublic slug={slug}/>;
  return <AdminWorkspace/>;
}

function AdminWorkspace(){
  const auth=useAdminToken();
  const [payload,setPayload]=useState<any>({booking_clients:[],clients:[],invitations:[],events:[],guests:[],rsvps:[]});
  const [tab,setTab]=useState("dashboard");
  const [query,setQuery]=useState("");
  const [notice,setNotice]=useState("");
  const [loading,setLoading]=useState(false);
  const [client,setClient]=useState<any>(null);
  const [invitation,setInvitation]=useState<any>(null);
  const [event,setEvent]=useState<any>(null);
  const [guest,setGuest]=useState<any>(null);
  const [selectedInvitation,setSelectedInvitation]=useState("");
  const [copied,setCopied]=useState("");
  const [commentRows,setCommentRows]=useState<any[]>([]);
  const [commentLoading,setCommentLoading]=useState(false);
  const call=useCallback(async(action:string,payloadValue:any={})=>{
    const {data,error}=await db.rpc("wedding_invitation_admin",{p_token:auth.token,p_action:action,p_payload:payloadValue});
    if(error)throw error;return data;
  },[auth.token]);
  const refresh=useCallback(async()=>{
    if(!auth.token)return;setLoading(true);setNotice("");
    try{const data=await call("dashboard");setPayload(data||{});}
    catch(e:any){setNotice(e?.message||"Could not load invitation workspace.");}
    finally{setLoading(false);}
  },[auth.token,call]);
  useEffect(()=>{void refresh()},[refresh]);
  const selected=payload.invitations.find((i:any)=>i.id===selectedInvitation)||payload.invitations[0];
  const save=async(action:string,value:any)=>{
    try{await call(action,value);setNotice("Saved successfully.");await refresh();setClient(null);setInvitation(null);setEvent(null);setGuest(null);}
    catch(e:any){setNotice(e?.message||"Could not save.");}
  };
  const openNewClient=()=>setClient({...blankClient});
  const openClient=(c:any)=>setClient({...c});
  const openNewInvitation=()=>setInvitation({...blankInvitation,client_id:payload.clients[0]?.id||"",slug:""});
  const openInvitation=(i:any)=>{setSelectedInvitation(i.id);setInvitation({...i,gallery_images:i.gallery_images||[]})};
  const copy=async(text:string,id:string)=>{await navigator.clipboard.writeText(text);setCopied(id);setTimeout(()=>setCopied(""),1800)};
  const publicUrl=(i:any)=>window.location.origin+"/invite/"+i.slug;
  const guestsFor=(id:string)=>(payload.guests||[]).filter((g:any)=>g.invitation_id===id);
  const rsvpsFor=(id:string)=>(payload.rsvps||[]).filter((r:any)=>r.invitation_id===id);
  const eventsFor=(id:string)=>(payload.events||[]).filter((e:any)=>e.invitation_id===id);
  const loadComments=async()=>{setCommentLoading(true);try{const result=await call("dashboard");setCommentRows(result.comments||[])}catch(e:any){setNotice(e?.message||"Could not load comments.")}finally{setCommentLoading(false)}};
  const moderateComment=async(id:string,approved:boolean)=>{try{await db.rpc("wedding_invitation_comment_admin",{p_token:auth.token,p_action:"moderate",p_payload:{id,approved}});await loadComments()}catch(e:any){setNotice(e?.message||"Could not update comment.")}};
  const deleteComment=async(id:string)=>{if(!window.confirm("Delete this guest wish permanently?"))return;try{await db.rpc("wedding_invitation_comment_admin",{p_token:auth.token,p_action:"delete",p_payload:{id}});await loadComments()}catch(e:any){setNotice(e?.message||"Could not delete comment.")}};
  const nav=[["dashboard","Dashboard"],["clients","Clients"],["invitations","Invitations"],["guests","Guest list"],["rsvps","RSVP responses"],["comments","Guest wishes"]];
  if(!auth.ready)return <div className="min-h-screen grid place-items-center bg-stone-950 text-white"><RefreshCw className="animate-spin"/></div>;
  if(!auth.token)return <main className="grid min-h-screen place-items-center bg-[#f5f1e9] px-4"><form onSubmit={auth.login} className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-2xl">
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#4b1525] text-2xl text-amber-200">র</div>
    <p className="mt-5 text-center text-xs font-bold tracking-[.25em] text-amber-800">RAMYACHOBI · INVITATION STUDIO</p><h1 className="mt-2 text-center font-serif text-3xl text-stone-900">Admin access</h1>
    <p className="mt-2 text-center text-sm text-stone-500">Sign in using your existing RamyaChobi booking admin code.</p>
    <input autoFocus required type="password" className={input+" mt-6"} placeholder="Admin access code" value={auth.code} onChange={e=>auth.setCode(e.target.value)}/>
    {auth.error&&<p className="mt-3 text-sm text-red-700">{auth.error}</p>}
    <button disabled={auth.busy} className={btn+" mt-4 w-full bg-stone-900 text-white"}><LogIn size={16}/>{auth.busy?"Signing in…":"Sign in securely"}</button>
    <a href="/" className="mt-5 block text-center text-sm text-stone-500 underline">Back to website</a>
  </form></main>;
  return <div className="min-h-screen bg-[#f5f2eb] text-stone-900">
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#4b1525] font-serif text-xl text-amber-200">র</div><div><p className="text-[10px] font-bold tracking-[.2em] text-amber-800">RAMYACHOBI</p><h1 className="font-serif text-xl">Invitation Studio</h1></div></div>
      <div className="flex gap-2"><a href="/" className={btn+" border border-stone-200 text-stone-700"}><Eye size={15}/>Website</a><button onClick={auth.logout} className={btn+" bg-stone-900 text-white"}><LogOut size={15}/>Logout</button></div>
    </div></header>
    <div className="mx-auto max-w-[1500px] px-4 py-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
        ["Total clients",payload.clients.length],["Invitations",payload.invitations.length],["Published",payload.invitations.filter((i:any)=>i.status==="published").length],["Guest responses",payload.rsvps.length+payload.guests.filter((g:any)=>g.rsvp_status!=="pending").length]
      ].map(([label,value]:any)=><div key={label} className="rounded-2xl border border-stone-200 bg-white p-5"><p className="text-sm text-stone-500">{label}</p><p className="mt-2 font-serif text-3xl">{value}</p></div>)}</div>
      <nav className="mt-6 flex gap-2 overflow-x-auto pb-2">{nav.map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={"shrink-0 rounded-xl px-4 py-3 text-sm font-semibold "+(tab===id?"bg-[#4b1525] text-white":"border border-stone-200 bg-white text-stone-600")}>{label}</button>)}</nav>
      {notice&&<div role="status" className="mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{notice}<button onClick={()=>setNotice("")}><X size={16}/></button></div>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-serif text-2xl">{nav.find(x=>x[0]===tab)?.[1]}</h2><p className="mt-1 text-sm text-stone-500">Create, edit and manage every wedding invitation.</p></div><button onClick={()=>void refresh()} className={btn+" border border-stone-200 bg-white"}><RefreshCw size={15}/>Refresh</button></div>
      {tab==="dashboard"&&<div className="mt-5 grid gap-4 lg:grid-cols-2"><section className="rounded-2xl border border-stone-200 bg-white p-5"><h3 className="font-serif text-xl">Quick actions</h3><div className="mt-4 grid gap-3 sm:grid-cols-2"><button onClick={()=>{openNewClient();setTab("clients")}} className={btn+" justify-start bg-[#4b1525] text-white"}><Plus size={16}/>Add new client</button><button onClick={()=>{openNewInvitation();setTab("invitations")}} className={btn+" justify-start border border-stone-200"}><Heart size={16}/>Create invitation</button></div></section><section className="rounded-2xl border border-stone-200 bg-white p-5"><h3 className="font-serif text-xl">Recently updated invitations</h3>{payload.invitations.slice(0,5).map((i:any)=><div key={i.id} className="mt-3 flex items-center justify-between border-b border-stone-100 pb-3"><div><p className="font-semibold">{i.bride_name} & {i.groom_name}</p><p className="text-xs text-stone-500">{i.slug} · {i.status}</p></div><button onClick={()=>{openInvitation(i);setTab("invitations")}} className="text-sm underline">Edit</button></div>)}</section></div>}
      {tab==="clients"&&<section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><label className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3 top-3 text-stone-400"/><input className={input+" pl-9"} placeholder="Search clients by name or phone" value={query} onChange={e=>setQuery(e.target.value)}/></label><button onClick={openNewClient} className={btn+" bg-[#4b1525] text-white"}><Plus size={16}/>New client</button></div>
        <div className="mt-4 space-y-2">{payload.clients.filter((c:any)=>[c.client_name,c.bride_name,c.groom_name,c.phone].join(" ").toLowerCase().includes(query.toLowerCase())).map((c:any)=><div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-100 p-4"><div><p className="font-semibold">{c.client_name} <span className="font-normal text-stone-500">· {c.bride_name} & {c.groom_name}</span></p><p className="text-xs text-stone-500">{c.phone} {c.booking_id?"· Linked booking": "· Manual client"}</p></div><button onClick={()=>openClient(c)} className={btn+" border border-stone-200"}>Edit client</button></div>)}</div>
        {client&&<div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/50 p-5"><div className="flex justify-between"><h3 className="font-serif text-xl">{client.id?"Edit client":"Add new client"}</h3><button onClick={()=>setClient(null)}><X/></button></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm">Client / family name<input className={input+" mt-1"} value={client.client_name} onChange={e=>setClient({...client,client_name:e.target.value})}/></label><label className="text-sm">Bride name (English)<input className={input+" mt-1"} value={client.bride_name} onChange={e=>setClient({...client,bride_name:e.target.value})}/></label><label className="text-sm">Bride name (বাংলা)<input className={input+" mt-1"} value={client.bride_name_bn||""} onChange={e=>setClient({...client,bride_name_bn:e.target.value})}/></label><label className="text-sm">Groom name (English)<input className={input+" mt-1"} value={client.groom_name} onChange={e=>setClient({...client,groom_name:e.target.value})}/></label><label className="text-sm">Groom name (বাংলা)<input className={input+" mt-1"} value={client.groom_name_bn||""} onChange={e=>setClient({...client,groom_name_bn:e.target.value})}/></label><label className="text-sm">Phone<input className={input+" mt-1"} value={client.phone} onChange={e=>setClient({...client,phone:e.target.value})}/></label><label className="text-sm">Email<input className={input+" mt-1"} value={client.email} onChange={e=>setClient({...client,email:e.target.value})}/></label><label className="text-sm">Address<input className={input+" mt-1"} value={client.address} onChange={e=>setClient({...client,address:e.target.value})}/></label><label className="text-sm sm:col-span-2">Link existing booking<select className={input+" mt-1"} value={client.booking_id||""} onChange={e=>{const b=payload.booking_clients.find((x:any)=>x.id===e.target.value);setClient({...client,booking_id:e.target.value,client_name:client.client_name||b?.client_name||"",bride_name:client.bride_name||b?.bride_name||"",groom_name:client.groom_name||b?.groom_name||"",phone:client.phone||b?.phone||"",email:client.email||b?.email||"",address:client.address||b?.address||""})}}><option value="">Manual client / no booking link</option>{payload.booking_clients.map((b:any)=><option key={b.id} value={b.id}>{b.reference_no} · {b.client_name} · {b.phone}</option>)}</select></label><label className="text-sm sm:col-span-2">Private admin notes<textarea className={input+" mt-1"} rows={2} value={client.notes||""} onChange={e=>setClient({...client,notes:e.target.value})}/></label></div>
          <button onClick={()=>void save("save_client",client)} className={btn+" mt-4 bg-stone-900 text-white"}><Save size={16}/>Save client</button></div>}
      </section>}
      {tab==="invitations"&&<div className="mt-5 grid gap-4 xl:grid-cols-[.85fr_1.15fr]"><section className="rounded-2xl border border-stone-200 bg-white p-5"><div className="flex justify-between gap-3"><h3 className="font-serif text-xl">Invitation records</h3><button onClick={openNewInvitation} className={btn+" bg-[#4b1525] text-white"}><Plus size={15}/>New</button></div>{payload.invitations.map((i:any)=><button key={i.id} onClick={()=>openInvitation(i)} className={"mt-3 w-full rounded-xl border p-4 text-left "+(selectedInvitation===i.id?"border-amber-700 bg-amber-50":"border-stone-100 hover:bg-stone-50")}><div className="flex items-center justify-between gap-2"><strong>{i.bride_name} & {i.groom_name}</strong><span className="text-xs uppercase text-stone-500">{i.status}</span></div><p className="mt-1 text-xs text-stone-500">/invite/{i.slug} · {i.event_count} events · {i.guest_count} guests</p></button>)}</section>
        <section className="rounded-2xl border border-stone-200 bg-white p-5"><h3 className="font-serif text-xl">{invitation?.id?"Edit invitation":invitation?"New invitation":"Invitation details"}</h3>{invitation?<><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm sm:col-span-2">Client<select className={input+" mt-1"} value={invitation.client_id} onChange={e=>setInvitation({...invitation,client_id:e.target.value})}><option value="">Select client</option>{payload.clients.map((c:any)=><option key={c.id} value={c.id}>{c.bride_name} & {c.groom_name} · {c.client_name}</option>)}</select></label>
          <label className="text-sm">Invitation title (English)<input className={input+" mt-1"} value={invitation.title} onChange={e=>setInvitation({...invitation,title:e.target.value})}/></label><label className="text-sm">Invitation title (বাংলা)<input className={input+" mt-1"} value={invitation.title_bn||""} onChange={e=>setInvitation({...invitation,title_bn:e.target.value})}/></label><label className="text-sm">URL slug<input className={input+" mt-1"} value={invitation.slug} onChange={e=>setInvitation({...invitation,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-")})}/></label>
          <label className="text-sm">Theme<select className={input+" mt-1"} value={invitation.theme} onChange={e=>setInvitation({...invitation,theme:e.target.value})}>{Object.entries(themeLabel).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></label><label className="text-sm">Status<select className={input+" mt-1"} value={invitation.status} onChange={e=>setInvitation({...invitation,status:e.target.value})}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
          <label className="text-sm sm:col-span-2">Welcome message (English)<textarea rows={3} className={input+" mt-1"} value={invitation.welcome_message} onChange={e=>setInvitation({...invitation,welcome_message:e.target.value})}/></label><label className="text-sm sm:col-span-2">Welcome message (বাংলা)<textarea rows={3} className={input+" mt-1"} value={invitation.welcome_message_bn||""} onChange={e=>setInvitation({...invitation,welcome_message_bn:e.target.value})}/></label>
          <label className="text-sm sm:col-span-2">Cover image URL<input className={input+" mt-1"} placeholder="https://…" value={invitation.cover_image_url} onChange={e=>setInvitation({...invitation,cover_image_url:e.target.value})}/></label><label className="text-sm sm:col-span-2">Couple photo URL<input className={input+" mt-1"} placeholder="https://…" value={invitation.couple_photo_url} onChange={e=>setInvitation({...invitation,couple_photo_url:e.target.value})}/></label>
          <label className="text-sm">RSVP deadline<input type="date" className={input+" mt-1"} value={invitation.rsvp_deadline||""} onChange={e=>setInvitation({...invitation,rsvp_deadline:e.target.value})}/></label><label className="text-sm">Dress code (English)<input className={input+" mt-1"} value={invitation.dress_code} onChange={e=>setInvitation({...invitation,dress_code:e.target.value})}/></label><label className="text-sm">Dress code (বাংলা)<input className={input+" mt-1"} value={invitation.dress_code_bn||""} onChange={e=>setInvitation({...invitation,dress_code_bn:e.target.value})}/></label>
          <label className="text-sm sm:col-span-2">Gallery image URLs (one per line)<textarea rows={3} className={input+" mt-1"} value={(invitation.gallery_images||[]).join("\n")} onChange={e=>setInvitation({...invitation,gallery_images:e.target.value.split("\n").map((v:string)=>v.trim()).filter(Boolean).slice(0,30)})}/></label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={invitation.show_countdown} onChange={e=>setInvitation({...invitation,show_countdown:e.target.checked})}/>Show save-the-date section</label>
        </div><div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>void save("save_invitation",invitation)} className={btn+" bg-stone-900 text-white"}><Save size={16}/>Save invitation</button>{invitation.id&&<button onClick={()=>void copy(publicUrl(invitation),"invite")} className={btn+" border border-stone-200"}><Copy size={15}/>{copied==="invite"?"Copied":"Copy guest link"}</button>}</div>
        {invitation.id&&<div className="mt-6 border-t border-stone-100 pt-5"><div className="flex flex-wrap justify-between gap-2"><h4 className="font-serif text-lg">Event schedule</h4><button onClick={()=>setEvent({...blankEvent,invitation_id:invitation.id})} className={btn+" border border-stone-200"}><Plus size={15}/>Add event</button></div>{eventsFor(invitation.id).map((e:any)=><div key={e.id} className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-stone-50 p-3"><div><p className="font-semibold">{e.title}</p><p className="text-xs text-stone-500">{moneylessDate(e.event_date)} · {e.venue}</p></div><button onClick={()=>setEvent({...e})} className="text-sm underline">Edit</button></div>)}</div>}
        </>:<p className="mt-4 text-sm text-stone-500">Choose an invitation or create a new one. First add a client, then create the invitation.</p>}</section></div>}
      {tab==="guests"&&<section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><h3 className="font-serif text-xl">Guest directory</h3><button disabled={!selected} onClick={()=>setGuest({...blankGuest,invitation_id:selected?.id||""})} className={btn+" bg-[#4b1525] text-white disabled:opacity-40"}><Plus size={15}/>Add guest</button></div><label className="mt-4 block text-sm">Invitation<select className={input+" mt-1"} value={selected?.id||""} onChange={e=>setSelectedInvitation(e.target.value)}>{payload.invitations.map((i:any)=><option key={i.id} value={i.id}>{i.bride_name} & {i.groom_name}</option>)}</select></label>
        {selected&&guestsFor(selected.id).map((g:any)=><div key={g.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-100 p-3"><div><p className="font-semibold">{g.guest_name}</p><p className="text-xs text-stone-500">{g.side} side · {g.group_name||"General"} · {g.rsvp_status}</p></div><div className="flex gap-2"><button onClick={()=>void copy(publicUrl(selected)+"?guest="+g.invite_token,"guest-"+g.id)} className="text-sm underline">{copied==="guest-"+g.id?"Copied":"Copy personal link"}</button><button onClick={()=>setGuest({...g})} className="text-sm underline">Edit</button></div></div>)}
      </section>}
      {tab==="rsvps"&&<section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5"><h3 className="font-serif text-xl">Guest RSVP responses</h3>{payload.rsvps.map((r:any)=><div key={r.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-100 p-4"><div><p className="font-semibold">{r.guest_name}</p><p className="text-xs text-stone-500">{r.phone} · {r.attendance==="attending"?"Attending":"Not attending"} · {r.attendee_count} guests</p>{r.message&&<p className="mt-1 text-sm text-stone-600">{r.message}</p>}</div><button onClick={()=>void save("review_rsvp",{id:r.id,reviewed:!r.reviewed})} className={btn+" border border-stone-200"}>{r.reviewed?"Reviewed":"Mark reviewed"}</button></div>)}</section>}
      {tab==="comments"&&<section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-serif text-xl">Guest wishes moderation</h3><p className="text-sm text-stone-500">Approve a message before it appears on the public invitation.</p></div><button onClick={()=>void loadComments()} className={btn+" border border-stone-200"}><RefreshCw size={15}/>Refresh</button></div>{commentLoading&&<p className="mt-4 text-sm">Loading…</p>}{commentRows.map((c:any)=><article key={c.id} className="mt-3 rounded-xl border border-stone-100 p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{c.guest_name} <span className="text-xs font-normal text-stone-500">· {c.client_name} · {c.slug}</span></p><p className="mt-2 text-sm text-stone-700">{c.message}</p><p className="mt-2 text-xs text-stone-500">{new Date(c.created_at).toLocaleString()}</p></div><div className="flex gap-2"><button onClick={()=>void moderateComment(c.id,!c.approved)} className={btn+" border border-stone-200"}>{c.approved?"Unpublish":"Approve"}</button><button onClick={()=>void deleteComment(c.id)} className={btn+" border border-red-200 text-red-700"}><Trash2 size={14}/>Delete</button></div></div></article>)}{!commentRows.length&&!commentLoading&&<p className="mt-4 text-sm text-stone-500">No guest wishes yet.</p>}</section>}
    </div>
    {event&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3"><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5"><div className="flex justify-between"><h3 className="font-serif text-xl">{event.id?"Edit event":"Add event"}</h3><button onClick={()=>setEvent(null)}><X/></button></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{[
      ["title","Event name (English)"],["title_bn","Event name (বাংলা)"],["event_date","Date"],["start_time","Start time"],["end_time","End time"],["venue","Venue (English)"],["venue_bn","Venue (বাংলা)"],["address","Full address (English)"],["address_bn","Full address (বাংলা)"],["maps_url","Google Maps URL"]
    ].map(([k,label])=><label key={k} className="text-sm">{label}<input type={k==="event_date"?"date":k.includes("time")?"time":"text"} className={input+" mt-1"} value={event[k]||""} onChange={e=>setEvent({...event,[k]:e.target.value})}/></label>)}<label className="text-sm">Event type<select className={input+" mt-1"} value={event.event_type} onChange={e=>setEvent({...event,event_type:e.target.value})}>{["engagement","holud","mehendi","wedding","reception","walima","birthday","other"].map(x=><option key={x}>{x}</option>)}</select></label><label className="text-sm sm:col-span-2">Notes<textarea className={input+" mt-1"} value={event.notes||""} onChange={e=>setEvent({...event,notes:e.target.value})}/></label></div><button onClick={()=>void save("save_event",event)} className={btn+" mt-4 bg-stone-900 text-white"}><Save size={16}/>Save event</button></div></div>}
    {guest&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3"><div className="w-full max-w-lg rounded-2xl bg-white p-5"><div className="flex justify-between"><h3 className="font-serif text-xl">{guest.id?"Edit guest":"Add guest"}</h3><button onClick={()=>setGuest(null)}><X/></button></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{[["guest_name","Guest name"],["phone","Phone"],["email","Email"],["group_name","Family / group"],["max_attendees","Maximum attendees"]].map(([k,label])=><label key={k} className="text-sm">{label}<input className={input+" mt-1"} type={k==="max_attendees"?"number":"text"} value={guest[k]??""} onChange={e=>setGuest({...guest,[k]:k==="max_attendees"?Number(e.target.value):e.target.value})}/></label>)}<label className="text-sm">Side<select className={input+" mt-1"} value={guest.side} onChange={e=>setGuest({...guest,side:e.target.value})}><option value="bride">Bride side</option><option value="groom">Groom side</option><option value="both">Both</option></select></label></div><button onClick={()=>void save("save_guest",guest)} className={btn+" mt-4 bg-stone-900 text-white"}><Save size={16}/>Save guest</button></div></div>}
    <footer className="py-8 text-center text-xs text-stone-400">RamyaChobi Invitation Studio · Secure administration</footer>
  </div>;
}
