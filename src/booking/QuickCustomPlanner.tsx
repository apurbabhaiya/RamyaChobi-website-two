import React, { useState } from 'react';
import { CustomBuilder, eventTypes, type CustomOptions, type CustomQuote, useCustomConfig } from './CustomPackages';
import type { EventInput } from './BookingPortal';

const field = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base text-stone-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100';
type Config = NonNullable<ReturnType<typeof useCustomConfig>['config']>;
const money = (n: number) => '৳' + n.toLocaleString('bn-BD');

export default function QuickCustomPlanner({ events, onEvents, options, onOptions, onQuote, config }: {
  events: EventInput[];
  onEvents: (events: EventInput[]) => void;
  options: CustomOptions;
  onOptions: (options: CustomOptions) => void;
  onQuote: (quote: CustomQuote | null) => void;
  config: Config;
}) {
  const [question, setQuestion] = useState(1);
  const selectedEvents = events.filter((event) => event.event_name);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
  const questions = ['শহর', 'অনুষ্ঠান', 'তারিখ ও সময়', 'সার্ভিস', 'বাজেট'];

  function patch(index: number, value: Partial<EventInput>) {
    onQuote(null);
    onEvents(events.map((event, itemIndex) => itemIndex === index ? { ...event, ...value } : event));
  }

  function toggle(name: string) {
    onQuote(null);
    const exists = events.some((event) => event.event_name === name);
    const next = exists
      ? events.filter((event) => event.event_name !== name).map((event, index) => ({ ...event, sort_order: index }))
      : [
          ...events.filter((event) => event.event_name),
          {
            event_name: name,
            event_date: '',
            start_time: '',
            end_time: '',
            venue: '',
            location: '',
            photographers: 1,
            cinematographers: 0,
            drone: false,
            special_photos: 0,
            video_edit: false,
            notes: '',
            sort_order: selectedEvents.length,
          },
        ];
    onEvents(next);
  }

  function updateTime(index: number, value: Partial<EventInput>) {
    const event = { ...events[index], ...value };
    let end_date = event.event_date;
    if (event.event_date && event.start_time && event.end_time && event.end_time < event.start_time) {
      const nextDay = new Date(event.event_date + 'T00:00:00Z');
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      end_date = nextDay.toISOString().slice(0, 10);
    }
    patch(index, { ...value, end_date });
  }

  const ready =
    question === 1 ? Boolean(options.city) :
    question === 2 ? selectedEvents.length > 0 :
    question === 3 ? selectedEvents.length > 0 && selectedEvents.every((event) =>
      Boolean(event.event_date && event.start_time && event.end_time && event.start_time !== event.end_time)) :
    question === 4 ? selectedEvents.length > 0 && selectedEvents.every((event) =>
      Boolean(event.venue.trim() && (event.photographers > 0 || event.cinematographers > 0 || event.drone))) :
    false;

  function continueQuestion() {
    if (!ready) return;
    onQuote(null);
    setQuestion((current) => Math.min(5, current + 1));
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-emerald-100 bg-[#f7faf6] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-wide text-emerald-800">নিজের প্যাকেজ সাজান</p>
            <h3 className="mt-1 text-lg font-black text-stone-900">প্রশ্ন {question} / ৫ · {questions[question - 1]}</h3>
          </div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800">{question} / ৫</span>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1.5" aria-label="কাস্টম প্যাকেজের অগ্রগতি">
          {questions.map((item, index) => (
            <div key={item} className={'h-1.5 rounded-full ' + (index + 1 <= question ? 'bg-emerald-700' : 'bg-stone-200')} />
          ))}
        </div>
      </section>

      {question === 1 && (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
          <h4 className="text-lg font-black">কোন শহরে অনুষ্ঠান হবে?</h4>
          <p className="mt-1 text-sm text-stone-600">শহর বেছে নিলে সেই অনুযায়ী যাতায়াত ও সার্ভিসের হিসাব হবে।</p>
          <label className="mt-4 block text-sm font-bold">
            অনুষ্ঠানের শহর
            <select className={field} value={options.city || ''} onChange={(event) => {
              onQuote(null);
              onOptions({ ...options, city: event.target.value });
            }}>
              <option value="">শহর বেছে নিন</option>
              {config.allowed_cities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </label>
          <p className="mt-3 text-xs leading-5 text-stone-500">আপনার শহর তালিকায় না থাকলে আপাতত বুকিং নিয়ে আলোচনার মাধ্যমে অফিসের সঙ্গে নিশ্চিত করতে পারবেন।</p>
        </section>
      )}

      {question === 2 && (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
          <h4 className="text-lg font-black">কোন কোন অনুষ্ঠানে ছবি বা ভিডিও লাগবে?</h4>
          <p className="mt-1 text-sm text-stone-600">একাধিক অনুষ্ঠান বেছে নিতে পারবেন।</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {eventTypes.map((name) => {
              const checked = events.some((event) => event.event_name === name);
              const label = name
                .replace('হিন্দু বিয়ে ·', 'হিন্দু বিয়ে ·')
                .replace('কনের আয়োজন / ব্রাইডাল শাওয়ার', 'কনের আয়োজন')
                .replace('গায়েহলুদ / হলুদের রাত', 'গায়েহলুদ');
              return (
                <label key={name} className={'flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold ' + (checked ? 'border-emerald-700 bg-emerald-50 text-emerald-950' : 'border-stone-200 bg-white')}>
                  <input type="checkbox" className="h-5 w-5 accent-emerald-700" checked={checked} onChange={() => toggle(name)} />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
          <p className="mt-3 text-sm font-semibold text-emerald-800">বাছাই করা অনুষ্ঠান: {selectedEvents.length}টি</p>
        </section>
      )}

      {question === 3 && (
        <section className="space-y-3">
          <div>
            <h4 className="text-lg font-black">প্রতিটি অনুষ্ঠান কবে এবং কখন হবে?</h4>
            <p className="mt-1 text-sm text-stone-600">তারিখ, শুরুর সময় ও শেষের সময় দিন।</p>
          </div>
          {events.map((event, index) => event.event_name ? (
            <section key={event.event_name} className="rounded-2xl border border-stone-200 bg-white p-4">
              <h5 className="mb-3 font-black text-emerald-900">{event.event_name}</h5>
              <label className="block text-sm font-semibold">অনুষ্ঠানের তারিখ
                <input className={field} type="date" min={today} value={event.event_date} onChange={(value) => updateTime(index, { event_date: value.target.value })} />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">শুরু
                  <input className={field} type="time" value={event.start_time} onChange={(value) => updateTime(index, { start_time: value.target.value })} />
                </label>
                <label className="text-sm font-semibold">শেষ
                  <input className={field} type="time" value={event.end_time} onChange={(value) => updateTime(index, { end_time: value.target.value })} />
                </label>
              </div>
              {event.end_date && event.end_date !== event.event_date && (
                <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">অনুষ্ঠানটি পরদিন শেষ হবে। যাতায়াতের হিসাবেও দুই দিন ধরা হবে।</p>
              )}
            </section>
          ) : null)}
        </section>
      )}

      {question === 4 && (
        <section className="space-y-3">
          <div>
            <h4 className="text-lg font-black">কী কী সার্ভিস প্রয়োজন?</h4>
            <p className="mt-1 text-sm text-stone-600">প্রতিটি অনুষ্ঠানের জন্য ছবি, ভিডিও বা ড্রোন বেছে নিন।</p>
          </div>
          {events.map((event, index) => event.event_name ? (
            <section key={event.event_name} className="rounded-2xl border border-stone-200 bg-white p-4">
              <h5 className="mb-3 font-black text-emerald-900">{event.event_name}</h5>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-stone-200 p-3">
                  <label className="flex items-center gap-2 font-semibold">
                    <input type="checkbox" className="h-5 w-5 accent-emerald-700" checked={event.photographers > 0} onChange={(value) => patch(index, { photographers: value.target.checked ? 1 : 0 })} />
                    ফটোগ্রাফি
                  </label>
                  {event.photographers > 0 && (
                    <label className="mt-2 block text-sm">ফটোগ্রাফারের সংখ্যা
                      <select className={field} value={event.photographers} onChange={(value) => patch(index, { photographers: Number(value.target.value) })}>
                        {[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count.toLocaleString('bn-BD')} জন</option>)}
                      </select>
                    </label>
                  )}
                  <p className="mt-2 text-xs text-stone-500">{money(config.photo_rate)} / ঘণ্টা / জন</p>
                </div>
                <div className="rounded-xl border border-stone-200 p-3">
                  <label className="flex items-center gap-2 font-semibold">
                    <input type="checkbox" className="h-5 w-5 accent-emerald-700" checked={event.cinematographers > 0} onChange={(value) => patch(index, { cinematographers: value.target.checked ? 1 : 0 })} />
                    ভিডিওগ্রাফি
                  </label>
                  {event.cinematographers > 0 && (
                    <label className="mt-2 block text-sm">ভিডিওগ্রাফারের সংখ্যা
                      <select className={field} value={event.cinematographers} onChange={(value) => patch(index, { cinematographers: Number(value.target.value) })}>
                        {[1, 2, 3, 4].map((count) => <option key={count} value={count}>{count.toLocaleString('bn-BD')} জন</option>)}
                      </select>
                    </label>
                  )}
                  <p className="mt-2 text-xs text-stone-500">{money(config.cinema_rate)} / ঘণ্টা / জন</p>
                </div>
                <label className="flex items-center gap-2 rounded-xl border border-stone-200 p-3 text-sm font-semibold">
                  <input type="checkbox" className="h-5 w-5 accent-emerald-700" disabled={!config.drone_rate} checked={event.drone} onChange={(value) => patch(index, { drone: value.target.checked })} />
                  ড্রোন ভিডিও {config.drone_rate ? '· ' + money(config.drone_rate) + ' / ঘণ্টা' : '· অফিসের সঙ্গে আলোচনা'}
                </label>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">স্পেশাল ছবি
                  <select className={field} value={event.special_photos || 0} onChange={(value) => patch(index, { special_photos: Number(value.target.value) })}>
                    {[0, 20, 50, 100, 200].map((count) => <option key={count} value={count}>{count ? count.toLocaleString('bn-BD') + 'টি · ' + money(count * config.photo_edit_rate) : 'প্রয়োজন নেই'}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-stone-200 p-3 text-sm">
                  <input type="checkbox" className="h-5 w-5 accent-emerald-700" checked={Boolean(event.video_edit)} onChange={(value) => patch(index, { video_edit: value.target.checked })} />
                  পূর্ণ ভিডিও ও ট্রেইলার সম্পাদনা · {money(config.video_edit_rate)}
                </label>
              </div>
              <label className="mt-3 block text-sm font-semibold">অনুষ্ঠানের স্থান
                <input className={field} value={event.venue} placeholder="যেমন: কমিউনিটি সেন্টার / বাসা" onChange={(value) => patch(index, { venue: value.target.value, location: value.target.value })} />
              </label>
              <label className="mt-3 block text-sm">বিশেষ নির্দেশনা (ঐচ্ছিক)
                <input className={field} value={event.notes} placeholder="কোনো বিশেষ চাহিদা থাকলে লিখুন" onChange={(value) => patch(index, { notes: value.target.value })} />
              </label>
            </section>
          ) : null)}
        </section>
      )}

      {question === 5 && (
        <section className="space-y-3">
          <CustomBuilder
            events={events}
            options={options}
            onOptions={(value) => { onQuote(null); onOptions(value); }}
            onEvent={patch}
            onQuote={onQuote}
            config={config}
            compact
          />
          <p className="rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-950">এই হিসাবটি প্রাথমিক অনুমান। রম্যছবি টিম তারিখ, লোকেশন ও সার্ভিস যাচাই করে চূড়ান্ত বাজেট নিশ্চিত করবে।</p>
        </section>
      )}

      <div className="flex items-center justify-between gap-3">
        {question > 1 ? (
          <button type="button" onClick={() => { onQuote(null); setQuestion((current) => current - 1); }} className="rounded-xl border border-stone-300 px-4 py-3 text-sm font-bold text-stone-700">পেছনে</button>
        ) : <span className="text-xs text-stone-500">একটি প্রশ্নের উত্তর দিয়ে এগিয়ে যান</span>}
        {question < 5 && (
          <button type="button" disabled={!ready} onClick={continueQuestion} className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">পরের প্রশ্ন <span aria-hidden="true">→</span></button>
        )}
        {question === 5 && !selectedEvents.length && <span className="text-xs text-amber-800">আগের ধাপে ফিরে অনুষ্ঠান বেছে নিন।</span>}
      </div>
    </div>
  );
}
