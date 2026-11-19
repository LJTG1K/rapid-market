import Link from 'next/link';
import Image from 'next/image';

/**
 * "How buying works" as three picture cards (Direction B from the campaign
 * options): pick an item, check its warehouse QC photos, receive one box.
 * The QC step gets the most visual weight, because it answers "is this a
 * scam?" for people new to buying agents.
 *
 * QC_PHOTOS: real Sugargoo warehouse QC photos (item flat on the green
 * inspection table beside the cm rulers), in public/assets/how-it-works/.
 * Two photos show side by side; three or more show the first large with the
 * rest as thumbnails. With none, the card shows an honest placeholder, never
 * a stand-in product shot.
 */
const QC_PHOTOS: { src: string; alt: string }[] = [
  { src: '/assets/how-it-works/qc-tee.jpg', alt: 'Warehouse QC photo: washed black rhinestone tee laid flat beside a cm ruler' },
  { src: '/assets/how-it-works/qc-pants.jpg', alt: 'Warehouse QC photo: belted check wide-leg trousers laid flat beside a cm ruler' },
];

/**
 * Step 3 photo. Stock image: "Brown cardboard box with bright orange tape" by
 * Giorgio Trovato on Unsplash (Unsplash License: free for commercial use, no
 * attribution required). https://unsplash.com/photos/_My6Tbu09ks
 * Set to null to fall back to the drawn parcel.
 */
const PARCEL_PHOTO: string | null = '/assets/how-it-works/parcel.jpg';

function Num({ n }: { n: number }) {
  return <span className="w-7 h-7 rounded-full bg-ink text-white grid place-items-center text-xs font-semibold shrink-0">{n}</span>;
}

function QcFrame() {
  if (QC_PHOTOS.length === 0) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-paper text-center px-6">
        <div>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="mx-auto mb-2 text-muted" aria-hidden="true">
            <path d="M4 8h3l2-2.5h6L17 8h3v11H4z" strokeLinejoin="round" />
            <circle cx="12" cy="13.5" r="3.5" />
          </svg>
          <p className="text-sm font-medium text-ink">Warehouse QC photos</p>
          <p className="text-xs text-muted">Every item, photographed before it ships</p>
        </div>
      </div>
    );
  }
  const tag = (
    <span className="absolute left-2.5 top-2.5 z-10 bg-white/95 rounded-full px-2.5 py-1 text-[11px] font-medium">
      Real QC photos
    </span>
  );
  if (QC_PHOTOS.length === 2) {
    return (
      <>
        <div className="absolute inset-0 grid grid-cols-2 gap-1">
          {QC_PHOTOS.map((p) => (
            <div key={p.src} className="relative">
              <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 18vw, 50vw" className="object-cover" />
            </div>
          ))}
        </div>
        {tag}
      </>
    );
  }
  const [main, ...thumbs] = QC_PHOTOS;
  return (
    <>
      <Image src={main.src} alt={main.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
      {thumbs.length > 0 && (
        <div className="absolute right-2.5 bottom-2.5 flex gap-1.5">
          {thumbs.slice(0, 3).map((p) => (
            <span key={p.src} className="relative w-11 h-11 rounded-md border-2 border-white overflow-hidden shadow-sm">
              <Image src={p.src} alt={p.alt} fill sizes="44px" className="object-cover" />
            </span>
          ))}
        </div>
      )}
      {tag}
    </>
  );
}

function ParcelFrame() {
  if (PARCEL_PHOTO) {
    return (
      <Image
        src={PARCEL_PHOTO}
        alt="A sealed cardboard parcel with orange tape"
        fill
        sizes="(min-width: 768px) 33vw, 100vw"
        className="object-cover object-[50%_60%]"
      />
    );
  }
  return (
    <div className="absolute inset-0 grid place-items-center bg-paper">
      <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
        <path d="M48 14 82 30v36L48 82 14 66V30z" fill="#fff" stroke="#0E0E10" strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 30l34 16 34-16M48 46v36" stroke="#0E0E10" strokeWidth="2" strokeLinejoin="round" />
        <path d="M31 22l34 16v10" stroke="#0E0E10" strokeWidth="2" strokeLinejoin="round" />
        <rect x="56" y="56" width="18" height="9" rx="2" transform="rotate(-25 56 56)" fill="#FFE680" stroke="#0E0E10" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export default function HowBuyingWorks({ className = '' }: { className?: string }) {
  return (
    <section className={`container-edit ${className}`}>
      <div className="flex items-end justify-between gap-4 mb-8 md:mb-10 flex-wrap">
        <h2 className="font-display text-ink text-2xl md:text-3xl">How buying works</h2>
        <Link href="/tutorial" className="text-sm font-medium link-underline whitespace-nowrap">
          Read the full guide →
        </Link>
      </div>
      <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <li className="border border-line rounded-xl p-3 flex flex-col">
          <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-paper mb-4">
            {/* carousel-2.jpg is a three-photo strip; crop to its first frame (jacket on a hanger). */}
            <div
              className="absolute inset-0 bg-no-repeat"
              style={{ backgroundImage: 'url(/carousel-2.jpg)', backgroundSize: '288% auto', backgroundPosition: '0% 30%' }}
              role="img"
              aria-label="Jacquard zip jacket from a brand indexed on RAPID"
            />
          </div>
          <div className="px-2 pb-2 flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-2"><Num n={1} /><h3 className="text-lg font-semibold">Pick from 150+ verified brands</h3></div>
            <p className="text-muted leading-relaxed mb-4">
              Create a free account through RAPID (it makes your Sugargoo account instantly), then buy anything in the index.
            </p>
            <Link href="/signup" className="mt-auto text-sm font-medium link-underline self-start">Create free account →</Link>
          </div>
        </li>

        <li className="border border-line rounded-xl p-3 flex flex-col">
          <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-paper mb-4">
            <QcFrame />
          </div>
          <div className="px-2 pb-2 flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-2"><Num n={2} /><h3 className="text-lg font-semibold">See warehouse photos before it ships</h3></div>
            <p className="text-muted leading-relaxed mb-4">
              Your order lands at the Sugargoo warehouse and gets photographed. Approve it, or ask for a swap or refund before it ships.
            </p>
            <Link href="/tutorial" className="mt-auto text-sm font-medium link-underline self-start">How QC works →</Link>
          </div>
        </li>

        <li className="border border-line rounded-xl p-3 flex flex-col">
          <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-paper mb-4">
            <ParcelFrame />
          </div>
          <div className="px-2 pb-2 flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-2"><Num n={3} /><h3 className="text-lg font-semibold">Everything arrives in one box</h3></div>
            <p className="text-muted leading-relaxed mb-4">
              Combine everything you&apos;ve bought from different sellers into one parcel and ship it home together.
            </p>
          </div>
        </li>
      </ol>
    </section>
  );
}
