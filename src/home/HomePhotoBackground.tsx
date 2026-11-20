import { useEffect, useRef, useState } from 'react';
import './portfolioPhotoWall.css';

const rowCount = 8;
const tileWidth = 88;

export default function HomePhotoBackground({ photos }: { photos: { image: string }[] }) {
  const backdrop = useRef<HTMLDivElement>(null);
  const [visibleWidth, setVisibleWidth] = useState(0);
  const images = [...new Set(photos.map(photo => photo.image))];
  const hasImages = images.length > 0;

  useEffect(() => {
    const element = backdrop.current;
    if (!element) return;
    const measure = () => setVisibleWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasImages]);

  if (!hasImages) return null;

  const rows: string[][] = Array.from({ length: rowCount }, () => []);
  images.forEach((image, index) => rows[index % rowCount].push(image));

  return (
    <div ref={backdrop} aria-hidden="true" className="ramya-home-photo-background"
      style={{ '--home-photo-width': tileWidth + 'px' } as React.CSSProperties}>
      {visibleWidth > 0 && rows.map((row, index) => {
        const sources = row.length ? row : [images[index % images.length]];
        const repetitions = Math.ceil(visibleWidth / (tileWidth * sources.length));
        const tiles = Array.from({ length: repetitions }, () => sources).flat();
        return (
          <div className="ramya-photo-row" key={index}>
            <div className="ramya-photo-track" style={{ animationDuration: (tiles.length * (4.6 + index % 3 * 0.3)) + 's' }}>
              {[false, true].map(copy => (
                <div className="ramya-photo-group" key={String(copy)} aria-hidden={copy || undefined}>
                  {tiles.map((image, tileIndex) => (
                    <img key={tileIndex} alt="" src={image} draggable={false}
                      loading="lazy" fetchPriority="low" decoding="async" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
