import { useRef, useState } from 'react';
import { Pause, Play, X } from 'lucide-react';
import './portfolioPhotoWall.css';

type Photo = { image: string; title: string };

export default function PortfolioPhotoWall({ photos }: { photos: Photo[] }) {
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<Photo | null>(null);
  const lightbox = useRef<HTMLDialogElement>(null);
  const unique = [...new Map(photos.map(photo => [photo.image, photo])).values()];
  const rows: Photo[][] = Array.from({ length: Math.min(4, unique.length) }, () => []);
  unique.forEach((photo, index) => rows[index % rows.length].push(photo));

  if (!rows.length) return null;

  return (
    <section id="photo-wall" aria-label="রম্যছবির ছবির গ্যালারি" data-paused={paused || !!selected || unique.length === 1}
      className="ramya-photo-wall relative mx-auto mb-8 max-w-6xl px-4 sm:px-6 md:mb-12">
      <div className="overflow-hidden rounded-2xl border border-[#19382e]/10 bg-[#e9e1cb] p-1.5 sm:rounded-3xl sm:p-2">
        <div className="ramya-photo-rows grid gap-1.5 sm:gap-2">
          {rows.map((row, index) => {
            // Repeat the full sequence until a pass spans the widest desktop viewport.
            const tiles = Array.from({ length: Math.ceil(15 / row.length) }, () => row).flat();
            const duration = (tiles.length * (3.3 + (index % 3) * 0.25)) + 's';
            return (
              <div className="ramya-photo-row" key={index}>
                <div className="ramya-photo-track" style={{ animationDuration: duration }}>
                  {[false, true].map(copy => (
                    <div className="ramya-photo-group" key={String(copy)} aria-hidden={copy || undefined}>
                      {tiles.map((photo, tileIndex) => {
                        const repeated = copy || tileIndex >= row.length;
                        return (
                          <button key={tileIndex} type="button" className="ramya-photo-tile"
                            aria-label={photo.title ? photo.title + ' — বড় করে দেখুন' : 'ছবি বড় করে দেখুন'}
                            aria-hidden={repeated || undefined} tabIndex={repeated ? -1 : undefined}
                            data-repeat={tileIndex >= row.length || undefined}
                            onClick={() => {
                              setSelected(photo);
                              lightbox.current?.showModal();
                            }}>
                            <img src={photo.image} alt="" loading="lazy" decoding="async" fetchPriority="low" draggable={false} />
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {unique.length > 1 && (
          <button type="button" onClick={() => setPaused(value => !value)}
            aria-label={paused ? 'ছবির স্লাইড চালু করুন' : 'ছবির স্লাইড থামান'}
            className="ramya-photo-pause absolute right-6 top-3 grid h-10 w-10 place-items-center rounded-full bg-[#19382e]/95 text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-9">
            {paused ? <Play aria-hidden="true" size={16} /> : <Pause aria-hidden="true" size={16} />}
          </button>
        )}
      </div>
      <dialog ref={lightbox} className="ramya-photo-lightbox" aria-label="বড় করে ছবি দেখুন"
        onClose={() => setSelected(null)}
        onClick={event => {
          if (event.target === event.currentTarget) lightbox.current?.close();
        }}>
        <button type="button" className="ramya-photo-lightbox-close" aria-label="ছবি বন্ধ করুন"
          onClick={() => lightbox.current?.close()}>
          <X aria-hidden="true" size={24} />
        </button>
        {selected && <img src={selected.image} alt={selected.title} decoding="async" />}
      </dialog>
    </section>
  );
}
