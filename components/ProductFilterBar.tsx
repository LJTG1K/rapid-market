import { useState } from 'react';

interface FilterGroupOption {
  key: string;
  label: string;
  /** Value passed to onSelect / compared against `selected`, if different from `key` (e.g. brand slug vs name). */
  value?: string;
}

export interface FilterGroupConfig {
  /** Stable id — used as the React key and the active-chip label prefix (e.g. "Style: Streetwear"). */
  key: string;
  title: string;
  allLabel: string;
  selected: string;
  onSelect: (value: string) => void;
  options: FilterGroupOption[];
  /** Scrollable list for a long option set (e.g. brands). */
  scroll?: boolean;
}

interface ProductFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  groups: FilterGroupConfig[];
  sorts: string[];
  selectedSort: string;
  onSortChange: (value: string) => void;
  resultCount: number;
}

/**
 * Horizontal Refine/Sort bar replacing the old always-open sidebar (see the
 * fashion-listings reskin brief — also applied to tech-listings). One drawer
 * -style panel works at every breakpoint and for any number of filter groups,
 * instead of maintaining separate desktop-list / mobile-select markup per
 * group. Filtering stays instant — this only changes where the controls
 * live, not how they behave (everything here filters an in-memory array, so
 * there's no batch "Apply" step to wait on).
 */
export default function ProductFilterBar({
  searchTerm,
  onSearchChange,
  groups,
  sorts,
  selectedSort,
  onSortChange,
  resultCount,
}: ProductFilterBarProps) {
  const [open, setOpen] = useState(false);

  const activeCount = groups.filter((g) => g.selected !== 'All').length;
  const hasActiveState = activeCount > 0 || searchTerm.trim() !== '';

  const clearAll = () => {
    groups.forEach((g) => g.onSelect('All'));
    onSearchChange('');
  };

  const panelCols = groups.length >= 3 ? 'sm:grid-cols-3' : groups.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-1';

  return (
    <div className="mb-8">
      <div className="sticky top-[58px] z-30 bg-stone/95 backdrop-blur-sm border-b border-line py-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search products…"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full sm:w-auto sm:flex-1 sm:min-w-[180px] px-3 py-2 bg-paper border border-line focus:outline-none focus:border-ink text-sm"
          />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={`font-mono text-[11px] uppercase tracking-wide px-3 py-2 border transition-colors ${
              open ? 'bg-ink text-paper border-ink' : 'border-line text-ink hover:border-ink'
            }`}
          >
            Refine{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
          <select
            value={selectedSort}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort"
            className="font-mono text-[11px] uppercase tracking-wide px-3 py-2 bg-paper border border-line focus:outline-none focus:border-ink"
          >
            {sorts.map((s) => (
              <option key={s} value={s}>
                Sort: {s}
              </option>
            ))}
          </select>
          <span className="ml-auto font-mono text-[11px] text-muted whitespace-nowrap">
            {resultCount} {resultCount === 1 ? 'piece' : 'pieces'} — every listing QC&apos;d through Sugargoo
          </span>
        </div>

        {hasActiveState && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {groups.map((g) => {
              if (g.selected === 'All') return null;
              const opt = g.options.find((o) => (o.value ?? o.key) === g.selected);
              const label = opt?.label ?? g.selected;
              return (
                <Chip key={g.key} label={`${g.title}: ${label}`} onClear={() => g.onSelect('All')} />
              );
            })}
            {searchTerm.trim() !== '' && <Chip label={`"${searchTerm.trim()}"`} onClear={() => onSearchChange('')} />}
            <button
              type="button"
              onClick={clearAll}
              className="font-mono text-[11px] uppercase tracking-wide text-muted hover:text-stamp underline decoration-line underline-offset-4 ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className={`grid grid-cols-1 ${panelCols} gap-8 border border-line border-t-0 bg-paper p-6`}>
          {groups.map((g) => (
            <FilterGroup
              key={g.key}
              title={g.title}
              options={g.options}
              selected={g.selected}
              onSelect={g.onSelect}
              allLabel={g.allLabel}
              scroll={g.scroll}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button type="button" onClick={onClear} className="tag inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity">
      {label}
      <span aria-hidden="true">×</span>
    </button>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onSelect,
  allLabel,
  scroll = false,
}: {
  title: string;
  options: FilterGroupOption[];
  selected: string;
  onSelect: (value: string) => void;
  allLabel: string;
  scroll?: boolean;
}) {
  return (
    <div>
      <h3 className="eyebrow mb-3">{title}</h3>
      <ul className={scroll ? 'max-h-56 overflow-y-auto pr-2' : ''}>
        <li>
          <button
            type="button"
            onClick={() => onSelect('All')}
            className={`block w-full text-left py-1.5 text-sm transition-colors ${
              selected === 'All' ? 'text-stamp font-semibold' : 'text-ink/70 hover:text-ink'
            }`}
          >
            {allLabel}
          </button>
        </li>
        {options.map((o) => {
          const val = o.value ?? o.key;
          return (
            <li key={o.key}>
              <button
                type="button"
                onClick={() => onSelect(val)}
                className={`block w-full text-left py-1.5 text-sm transition-colors ${
                  selected === val ? 'text-stamp font-semibold' : 'text-ink/70 hover:text-ink'
                }`}
              >
                {o.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
