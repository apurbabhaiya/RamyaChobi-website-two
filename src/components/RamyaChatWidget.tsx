import React, { useEffect, useRef, useState } from 'react';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../services/supabase';

type Message = { role: 'assistant' | 'user'; text: string; links?: { label: string; href: string }[] };
type VoiceLanguage = 'bn' | 'en';

const banglaSuggestions = ['হিন্দু বিয়ে', 'মুসলিম বিয়ে', '১ ঘণ্টার ক্যাজুয়াল ফটোশুট'];
const englishSuggestions = ['Wedding packages', 'How can I book?', 'Show me your portfolio'];
const allowedLinks = ['/booking', '/booking?intent=discussion', '/booking/city', '/packages', '/portfolio', '/stories'];

export default function RamyaChatWidget() {
  const [visible, setVisible] = useState(true);
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<VoiceLanguage>('bn');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'স্বাগতম! প্যাকেজ, বুকিং ও ফটোগ্রাফি সম্পর্কে জানতে মাইক্রোফোন চাপুন।' },
  ]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState('কথা বলতে মাইক চাপুন');
  const [lastReply, setLastReply] = useState('');
  const recognitionRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch {}
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  function speak(text: string) {
    if (!('speechSynthesis' in window)) {
      setStatus('এই ব্রাউজারে ভয়েস উত্তর সমর্থিত নয়');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[\u0980-\u09FF]/.test(text) ? 'bn-BD' : 'en-US';
    const voices = window.speechSynthesis.getVoices();
    const prefix = utterance.lang.toLowerCase().split('-')[0];
    const voice = voices.find(item => item.lang.toLowerCase().startsWith(prefix));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => {
      setSpeaking(true);
      setStatus('উত্তর দিচ্ছি…');
    };
    utterance.onend = () => {
      setSpeaking(false);
      setStatus('কথা বলতে মাইক চাপুন');
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setStatus('উত্তর তৈরি হয়েছে');
    };
    window.speechSynthesis.speak(utterance);
  }

  async function send(value = input, readAloud = false, preferredLanguage?: VoiceLanguage) {
    const question = value.trim();
    if (!question || busy) return;

    const responseLanguage: VoiceLanguage = preferredLanguage || (/[\u0980-\u09FF]/.test(question) ? 'bn' : language);
    const previousHistory = messages.filter(message => message.role === 'user').slice(-8).map(message => message.text);
    setMessages(previous => [...previous, { role: 'user', text: question }]);
    setInput('');
    setBusy(true);
    setStatus(responseLanguage === 'bn' ? 'উত্তর তৈরি হচ্ছে…' : 'Preparing an answer…');

    try {
      const response = await fetch(SUPABASE_URL + '/functions/v1/public-voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ message: question, history: previousHistory, language: responseLanguage }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.reply || 'Chat unavailable');

      const reply = String(data.reply || 'দুঃখিত, এই মুহূর্তে উত্তর পাওয়া যাচ্ছে না।');
      const links = Array.isArray(data.links)
        ? data.links.filter((item: any) => typeof item.label === 'string' && allowedLinks.includes(item.href))
        : [];
      setMessages(previous => [...previous, { role: 'assistant', text: reply, links }]);
      setLastReply(reply);
      if (readAloud) speak(reply);
      else setStatus('কথা বলতে মাইক চাপুন');
    } catch {
      const fallback = responseLanguage === 'en'
        ? 'I cannot reach the assistant right now. Please try again or contact us on WhatsApp.'
        : 'এই মুহূর্তে উত্তর পাওয়া যাচ্ছে না। আবার চেষ্টা করুন অথবা WhatsApp-এ যোগাযোগ করুন।';
      setMessages(previous => [...previous, { role: 'assistant', text: fallback }]);
      setLastReply(fallback);
      if (readAloud) speak(fallback);
      else setStatus('আবার চেষ্টা করুন');
    } finally {
      setBusy(false);
    }
  }

  function startVoice() {
    if (listening) {
      try { recognitionRef.current?.stop(); } catch {}
      setListening(false);
      setStatus('কথা বলা বন্ধ হয়েছে');
      return;
    }

    const browser = window as any;
    const Recognition = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Recognition) {
      const notice = language === 'bn'
        ? 'এই ব্রাউজারে ভয়েস ইনপুট নেই। Chrome বা Edge ব্যবহার করুন, অথবা লিখে প্রশ্ন করুন।'
        : 'Voice input is not available in this browser. Try Chrome or Edge, or type your question.';
      setMessages(previous => [...previous, { role: 'assistant', text: notice }]);
      setLastReply(notice);
      setOpen(true);
      setStatus('Voice input unavailable');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = language === 'bn' ? 'bn-BD' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setListening(true);
      setStatus(language === 'bn' ? 'শুনছি… এখন কথা বলুন' : 'Listening… speak now');
    };
    recognition.onresult = (event: any) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript || '').trim();
      setListening(false);
      if (transcript) {
        setInput(transcript);
        void send(transcript, true, language);
      } else {
        setStatus('কথা বোঝা যায়নি; আবার চেষ্টা করুন');
      }
    };
    recognition.onerror = (event: any) => {
      setListening(false);
      const message = event?.error === 'not-allowed'
        ? 'মাইক্রোফোন ব্যবহারের অনুমতি দিন'
        : event?.error === 'no-speech'
          ? 'কোনো কথা শোনা যায়নি; আবার চেষ্টা করুন'
          : 'ভয়েস সেবা পাওয়া যাচ্ছে না; লিখে প্রশ্ন করতে পারেন';
      setStatus(message);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setListening(false);
      setStatus('মাইক্রোফোন চালু করা যায়নি');
    }
  }

  function closeAssistant() {
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setListening(false);
    setSpeaking(false);
    setVisible(false);
  }

  function toggleLanguage() {
    setLanguage(previous => previous === 'bn' ? 'en' : 'bn');
    setStatus(language === 'bn' ? 'English selected' : 'বাংলা নির্বাচন করা হয়েছে');
  }

  if (!visible) return <div className="ramya-chat-widget-dock">
    <button
      type="button"
      className="ramya-voice-launcher"
      onClick={() => setVisible(true)}
      aria-label="RamyaChobi Voice Assistant আবার খুলুন"
      title="Open RamyaChobi Assistant"
    >🎙</button>
  </div>;

  const suggestions = language === 'bn' ? banglaSuggestions : englishSuggestions;

  return <div className="ramya-chat-widget-dock">
    {lastReply && !open && <aside className="ramya-voice-reply" aria-live="polite">
      <p>{lastReply}</p>
      <button type="button" onClick={() => setOpen(true)}>{language === 'bn' ? 'বিস্তারিত দেখুন' : 'View details'}</button>
      <button type="button" onClick={() => setLastReply('')} aria-label="উত্তরের বার্তা বন্ধ করুন">×</button>
    </aside>}

    <div className="ramya-voice-compact" aria-label="RamyaChobi Voice Assistant">
      <div className="ramya-voice-brand">
        <span className="ramya-voice-mark" aria-hidden="true">✦</span>
        <span className="ramya-voice-brand-copy">
          <strong>RamyaChobi</strong>
          <small>{listening ? (language === 'bn' ? 'শুনছি…' : 'Listening…') : speaking ? 'Speaking…' : status}</small>
        </span>
      </div>
      <div className="ramya-voice-actions">
        <button className="ramya-voice-language" type="button" onClick={toggleLanguage} aria-label="ভাষা পরিবর্তন করুন" title="বাংলা / English">
          {language === 'bn' ? 'বাংলা' : 'EN'}
        </button>
        <button className={'ramya-voice-mic' + (listening ? ' is-listening' : '')} type="button" onClick={startVoice} disabled={busy || speaking} aria-label={listening ? 'কথা বলা বন্ধ করুন' : 'ভয়েসে কথা বলুন'} title={listening ? 'Stop listening' : 'Speak'}>
          {listening ? '■' : '🎙'}
        </button>
        <button className="ramya-voice-chat" type="button" onClick={() => setOpen(previous => !previous)} aria-label="চ্যাট খুলুন" title="Text chat">💬</button>
        <button className="ramya-voice-close" type="button" onClick={closeAssistant} aria-label="Assistant বন্ধ করুন" title="Close">×</button>
      </div>
    </div>

    {open && <section id="ramya-chat-panel" className="ramya-chat-panel" aria-label="রম্যছবি চ্যাট সহায়তা" style={{ width: 'min(360px, calc(100vw - 24px))', height: 'min(500px, calc(100dvh - 120px))', background: '#fff', color: '#172033', borderRadius: 18, boxShadow: '0 12px 48px #0003', display: 'flex', flexDirection: 'column', overflow: 'hidden', marginBottom: 10 }}>
      <header style={{ padding: 13, background: '#193e32', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden="true">📸</span>
        <span style={{ flex: 1 }}>RamyaChobi Assistant<small style={{ display: 'block', fontSize: 11, fontWeight: 400, opacity: .8 }}>বাংলা · English · Voice</small></span>
        <button type="button" onClick={toggleLanguage} aria-label="ভাষা পরিবর্তন করুন" style={{ color: 'white', background: 'transparent', border: '1px solid #ffffff66', borderRadius: 8, padding: '5px 8px', cursor: 'pointer' }}>{language === 'bn' ? 'বাংলা' : 'EN'}</button>
        <button type="button" onClick={() => setOpen(false)} aria-label="চ্যাট বন্ধ করুন" style={{ color: 'white', background: 'none', border: 0, cursor: 'pointer', fontSize: 20 }}>×</button>
      </header>
      <div aria-live="polite" aria-relevant="additions text" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {messages.map((message, index) => <div key={index} style={{ background: message.role === 'user' ? '#e3eee7' : '#f4f2ec', margin: '8px 0', marginLeft: message.role === 'user' ? 32 : 0, marginRight: message.role === 'assistant' ? 22 : 0, padding: 10, borderRadius: 12, whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: 13 }}>
          {message.text}
          {message.links?.length ? <div className="mt-3 flex flex-wrap gap-2">{message.links.map(link => <a key={link.href} href={link.href} className="inline-flex min-h-10 items-center rounded-xl border border-emerald-800 bg-white px-3 py-2 text-xs font-bold text-emerald-900">{link.label} →</a>)}</div> : null}
          {message.role === 'assistant' && <button type="button" onClick={() => speak(message.text)} aria-label="উত্তরটি শুনুন" title="উত্তরটি শুনুন" style={{ display: 'block', marginTop: 7, border: 0, background: 'transparent', color: '#193e32', padding: 0, cursor: 'pointer', fontSize: 11 }}>🔊 {speaking ? 'আবার শুনুন' : 'উত্তর শুনুন'}</button>}
        </div>)}
        {busy && <p role="status" style={{ fontSize: 12, color: '#666' }}>উত্তর তৈরি হচ্ছে…</p>}
        <div ref={endRef} />
      </div>
      <div style={{ padding: '4px 9px 7px', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {suggestions.map(suggestion => <button type="button" key={suggestion} onClick={() => void send(suggestion, false, language)} disabled={busy} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 20, border: '1px solid #ddd', background: '#fff' }}>{suggestion}</button>)}
      </div>
      <p style={{ margin: '0 11px 6px', fontSize: 9, color: '#6c6c66', lineHeight: 1.35 }}>মাইক্রোফোন চালু করলে ব্রাউজারের ভয়েস সেবা আপনার কথাকে টেক্সটে রূপান্তর করতে পারে। অডিও এই ওয়েবসাইটে সংরক্ষণ করা হয় না।</p>
      <div style={{ padding: '3px 11px 7px', display: 'flex', gap: 12, fontSize: 11 }}>
        <a href="https://wa.me/8801776044951" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a href="tel:+8801776044951">01776044951</a>
      </div>
      <form onSubmit={event => { event.preventDefault(); void send(input); }} style={{ padding: '7px 9px 10px', display: 'flex', gap: 6 }}>
        <input aria-label="আপনার প্রশ্ন" value={input} onChange={event => setInput(event.target.value)} placeholder={language === 'bn' ? 'বাংলায় লিখুন…' : 'Type in English…'} style={{ flex: 1, minWidth: 0, padding: '9px 8px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16 }} />
        <button type="button" aria-label={listening ? 'শুনছি' : 'ভয়েসে প্রশ্ন বলুন'} onClick={startVoice} disabled={busy || speaking} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0 9px', background: listening ? '#e9eee5' : '#fff' }}>{listening ? '■' : '🎙️'}</button>
        <button type="submit" disabled={busy || !input.trim()} style={{ background: '#193e32', color: '#fff', border: 0, borderRadius: 8, padding: '0 11px', fontWeight: 700, fontSize: 12 }}>{language === 'bn' ? 'পাঠান' : 'Send'}</button>
      </form>
    </section>}
  </div>;
}
