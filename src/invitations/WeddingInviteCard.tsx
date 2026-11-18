import React, { useState } from 'react';
import { CalendarDays, Clock3, Heart, MapPin, Sparkles } from 'lucide-react';
import { type WeddingInvite, INVITE_THEMES, readableDate, readableTime, safeInvitePhoto } from './invitationModel';

type Props = { invite: WeddingInvite; compact?: boolean };

export default function WeddingInviteCard({ invite, compact = false }: Props) {
  const [opened, setOpened] = useState(false);
  const palette = INVITE_THEMES[invite.theme];
  const photo = safeInvitePhoto(invite.photo);
  return (
    <div className="invitation-scene" style={{ '--invite-dark': palette.dark, '--invite-gold': palette.accent, '--invite-light': palette.light, '--invite-paper': palette.paper } as React.CSSProperties}>
      <div className={'invitation-envelope '+(opened ? 'is-open':'')+(compact ? ' is-compact':'')}>
        <div className="invitation-glow" aria-hidden="true" />
        <section className="invitation-card" aria-label="Wedding invitation details">
          <div className="invitation-ornament" aria-hidden="true">✦ &nbsp; ❧ &nbsp; ✦</div>
          {photo ? <img className="invitation-couple-photo" src={photo} alt="Couple's invitation photograph" loading="lazy" referrerPolicy="no-referrer" /> : <div className="invitation-photo-placeholder" aria-hidden="true"><Heart size={34} strokeWidth={1} /><span>Forever Begins Here</span></div>}
          <p className="invitation-kicker">YOU ARE CORDIALLY INVITED TO</p>
          <p className="invitation-occasion">{invite.occasion || 'Wedding Celebration'}</p>
          <div className="invitation-names"><span>{invite.bride || 'The Bride'}</span><span className="invitation-amp">&</span><span>{invite.groom || 'The Groom'}</span></div>
          {invite.guest && <p className="invitation-guest">Especially for {invite.guest}</p>}
          <div className="invitation-divider" />
          <div className="invitation-detail"><CalendarDays size={17}/><span>{readableDate(invite.date)}</span></div>
          <div className="invitation-detail"><Clock3 size={17}/><span>{readableTime(invite.time)}</span></div>
          {(invite.venue || invite.address) && <div className="invitation-detail"><MapPin size={17}/><span>{[invite.venue, invite.address].filter(Boolean).join(' · ')}</span></div>}
          <p className="invitation-message">{invite.message || 'Join us as we begin our forever.'}</p>
          <p className="invitation-brand">WITH LOVE · RAMYACHOBI</p>
        </section>
        <button type="button" className="invitation-cover" onClick={() => setOpened(v => !v)} aria-expanded={opened} aria-label={opened ? 'Close invitation cover' : 'Open wedding invitation'}>
          <span className="invitation-cover-border" />
          <span className="invitation-cover-floral" aria-hidden="true">✺ · ✧ · ✺</span>
          <span className="invitation-cover-heading">Together Forever</span>
          <span className="invitation-cover-names">{invite.bride || 'Bride'} <em>&</em> {invite.groom || 'Groom'}</span>
          <span className="invitation-cover-event">{readableDate(invite.date)}</span>
          <span className="invitation-cover-seal"><Heart size={24} fill="currentColor" strokeWidth={1.5}/></span>
          <span className="invitation-cover-hint"><Sparkles size={15}/> TAP TO OPEN <Sparkles size={15}/></span>
        </button>
      </div>
      <button className="invitation-toggle" type="button" onClick={() => setOpened(v => !v)}>{opened ? 'Close the invitation' : 'Open the invitation'} <span aria-hidden="true">{opened ? '↶' : '↗'}</span></button>
    </div>
  );
}
