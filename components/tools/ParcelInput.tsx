import type { ParcelInput as ParcelInputValue } from '@/lib/shipping/pricing';

interface Preset {
  label: string;
  icon: string;
  parcel: ParcelInputValue;
}

const PRESETS: Preset[] = [
  { label: 'Small item', icon: '👟', parcel: { weightGrams: 800, lengthCm: 33, widthCm: 22, heightCm: 13 } },
  { label: 'Medium haul', icon: '📦', parcel: { weightGrams: 2500, lengthCm: 40, widthCm: 30, heightCm: 25 } },
  { label: 'Big haul', icon: '🧳', parcel: { weightGrams: 6000, lengthCm: 55, widthCm: 40, heightCm: 35 } },
];

/** Reference divisor for the indicative readout only — real per-line pricing
 *  uses each line's own volumetricDivisor via lib/shipping/pricing.ts. */
const REFERENCE_DIVISOR = 6000;

interface ParcelInputProps {
  value: ParcelInputValue;
  onChange: (value: ParcelInputValue) => void;
  className?: string;
}

export default function ParcelInput({ value, onChange, className = '' }: ParcelInputProps) {
  const set = (patch: Partial<ParcelInputValue>) => onChange({ ...value, ...patch });

  const hasDims = !!(value.lengthCm && value.widthCm && value.heightCm);
  const referenceVolumetric = hasDims
    ? Math.round(((value.lengthCm! * value.widthCm! * value.heightCm!) / REFERENCE_DIVISOR) * 1000)
    : null;

  return (
    <div className={className}>
      <div className="mb-6">
        <h3 className="eyebrow mb-3">Presets</h3>
        <div className="flex gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.parcel)}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 border border-line hover:border-ink transition-colors text-xs font-mono uppercase tracking-wide"
            >
              <span className="text-xl leading-none">{preset.icon}</span>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-2">
        <div className="col-span-2">
          <label htmlFor="parcel-weight" className="eyebrow block mb-2">Weight (g)</label>
          <input
            id="parcel-weight"
            type="number"
            min={0}
            step={50}
            value={value.weightGrams || ''}
            onChange={(e) => set({ weightGrams: Number(e.target.value) })}
            placeholder="e.g. 1200"
            className="w-full px-3 py-2.5 bg-paper border border-line focus:outline-none focus:border-ink text-sm"
          />
        </div>
        <div>
          <label htmlFor="parcel-length" className="eyebrow block mb-2">Length (cm)</label>
          <input
            id="parcel-length"
            type="number"
            min={0}
            value={value.lengthCm ?? ''}
            onChange={(e) => set({ lengthCm: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="—"
            className="w-full px-3 py-2.5 bg-paper border border-line focus:outline-none focus:border-ink text-sm"
          />
        </div>
        <div>
          <label htmlFor="parcel-width" className="eyebrow block mb-2">Width (cm)</label>
          <input
            id="parcel-width"
            type="number"
            min={0}
            value={value.widthCm ?? ''}
            onChange={(e) => set({ widthCm: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="—"
            className="w-full px-3 py-2.5 bg-paper border border-line focus:outline-none focus:border-ink text-sm"
          />
        </div>
        <div>
          <label htmlFor="parcel-height" className="eyebrow block mb-2">Height (cm)</label>
          <input
            id="parcel-height"
            type="number"
            min={0}
            value={value.heightCm ?? ''}
            onChange={(e) => set({ heightCm: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="—"
            className="w-full px-3 py-2.5 bg-paper border border-line focus:outline-none focus:border-ink text-sm"
          />
        </div>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        {hasDims
          ? `Reference volumetric weight ≈ ${referenceVolumetric}g at a standard 6000 divisor. Lines below use their own actual divisor for pricing.`
          : 'Add dimensions to price lines that bill by box size rather than actual weight (common for bulky, lightweight items like shoes).'}
      </p>
    </div>
  );
}
