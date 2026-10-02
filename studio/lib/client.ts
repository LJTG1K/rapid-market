// Browser-side helpers.
const EDITOR_KEY = 'studio.editorName';

export function getEditorName(): string {
  try {
    return localStorage.getItem(EDITOR_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setEditorNameStored(name: string) {
  try {
    localStorage.setItem(EDITOR_KEY, name);
  } catch {
    /* private mode: name lasts for this tab only */
  }
}

export async function api<T = any>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? 'GET',
    headers: {
      'x-studio-editor': encodeURIComponent(getEditorName()),
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/api/login')) {
    window.location.href = '/login';
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

export const FIELD_LABELS: Record<string, string> = {
  brandName: 'Name',
  slug: 'Slug',
  description: 'Description',
  aesthetic: 'Tags',
  targetCustomer: 'Target customer',
  notes: 'Internal notes',
  __record: 'Brand',
  min: 'First product ID',
  max: 'Last product ID',
  perVisit: 'Per visit',
};
