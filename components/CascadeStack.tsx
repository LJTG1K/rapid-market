import { useState } from 'react';
import Reveal from './Reveal';

interface CascadeImage {
  src: string;
  alt: string;
}

// Diagonal staircase, largest at top-left down to smallest at bottom-right —
// each frame uses the page background as a 4px "mat" so overlaps read as
// physically stacked prints rather than clipped bitmaps.
const SLOTS = [
  { pos: 'top-0 left-[8%] w-[58%]', z: 'z-10' },
  { pos: 'top-[12%] right-0 w-[48%]', z: 'z-20' },
  { pos: 'top-[44%] left-0 w-[52%]', z: 'z-30' },
  { pos: 'bottom-0 right-[8%] w-[30%]', z: 'z-40' },
];

function CascadeFrame({ img, slot, delay }: { img: CascadeImage; slot: typeof SLOTS[number]; delay: number }) {
  const [errored, setErrored] = useState(false);

  return (
    <Reveal
      delay={delay}
      className={`absolute ${slot.pos} ${slot.z} aspect-square border-4 border-stone shadow-stamp overflow-hidden bg-paper transition-transform duration-300 hover:-translate-y-1 hover:z-50`}
    >
      {img.src && !errored ? (
        <img
          src={img.src}
          alt={img.alt}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div className="w-full h-full placeholder-media flex items-center justify-center font-mono text-[10px] uppercase tracking-wide text-muted text-center px-3">
          [ {img.alt} ]
        </div>
      )}
    </Reveal>
  );
}

export default function CascadeStack({ images }: { images: CascadeImage[] }) {
  return (
    <div className="relative h-[520px] xl:h-[600px]">
      {images.slice(0, 4).map((img, i) => (
        <CascadeFrame key={i} img={img} slot={SLOTS[i]} delay={i * 140} />
      ))}
    </div>
  );
}
