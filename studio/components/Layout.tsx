import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, type ReactNode } from 'react';
import { api, timeAgo } from '../lib/client';
import { PendingTray } from './PendingTray';
import { useStudio } from './StudioContext';
import { Button, Input, Modal, cx } from './ui';

const NAV = [
  { href: '/brands', label: 'Brands', icon: '◆' },
  { href: '/products', label: 'Products', icon: '▤', soon: true },
  { href: '/picks', label: "Gilly's Picks", icon: '★' },
  { href: '/blog', label: 'Blog', icon: '✎', soon: true },
  { href: '/history', label: 'History', icon: '↺' },
];

export function Layout({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const router = useRouter();
  const { drafts, setTrayOpen, editorName, setEditorName, toast } = useStudio();
  const [renaming, setRenaming] = useState(false);

  async function logout() {
    await api('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen min-w-[1100px]">
      <Head>
        <title>{`${title} · RAPID Studio`}</title>
      </Head>
      <nav className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-zinc-900 text-[11px] font-black tracking-tight text-white">R</span>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold">RAPID Studio</div>
            <div className="text-[11px] text-zinc-400">Content editor</div>
          </div>
        </div>
        <ul className="space-y-0.5 px-3">
          {NAV.map((n) => {
            const active = router.pathname.startsWith(n.href);
            return (
              <li key={n.href}>
                {n.soon ? (
                  <span className="flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-zinc-400">
                    <span className="w-4 text-center text-xs">{n.icon}</span>
                    {n.label}
                    <span className="ml-auto rounded bg-zinc-100 px-1.5 text-[10px] text-zinc-400">Soon</span>
                  </span>
                ) : (
                  <Link
                    href={n.href}
                    className={cx(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px]',
                      active ? 'bg-zinc-100 font-medium text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                    )}
                  >
                    <span className="w-4 text-center text-xs">{n.icon}</span>
                    {n.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-auto border-t border-zinc-100 p-3">
          <button onClick={() => setRenaming(true)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-zinc-50">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
              {(editorName || '?').slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] text-zinc-800">{editorName || 'Set your name'}</span>
              <span className="block text-[11px] text-zinc-400">Editing as · change</span>
            </span>
          </button>
          <button onClick={logout} className="mt-1 w-full rounded-md px-2 py-1 text-left text-[11px] text-zinc-400 hover:text-zinc-700">
            Sign out
          </button>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 px-8 backdrop-blur">
          <h1 className="text-[15px] font-semibold">{title}</h1>
          <div className="flex items-center gap-3">
            {actions}
            <DeployPill />
            <Button variant={drafts.length ? 'publish' : 'secondary'} onClick={() => setTrayOpen(true)}>
              {drafts.length ? `Review & publish (${drafts.length})` : 'No pending changes'}
            </Button>
          </div>
        </header>
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>

      <PendingTray />
      <EditorNamePrompt key={`${renaming}${editorName}`} open={editorName === '' || renaming} initial={editorName ?? ''} onSave={(n) => { setEditorName(n); setRenaming(false); }} onCancel={editorName ? () => setRenaming(false) : undefined} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm text-white shadow-lg">{toast}</div>
      )}
    </div>
  );
}

function DeployPill() {
  const { status, refreshStatus } = useStudio();
  if (!status) return null;
  const { deploy, contentMode } = status;
  if (contentMode === 'local') {
    return <span className="rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-[11px] text-zinc-500">Dev mode · local files</span>;
  }
  if (deploy.state === 'unconfigured') return null;
  const map = {
    live: ['bg-accent', 'Site live'],
    deploying: ['bg-amber-500 animate-pulse', 'Deploying…'],
    failed: ['bg-red-600', 'Deploy failed'],
    unknown: ['bg-zinc-400', 'Status unknown'],
  } as const;
  const [dot, label] = map[deploy.state as keyof typeof map];
  return (
    <a
      href={deploy.url ?? undefined}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={() => refreshStatus().catch(() => {})}
      title={deploy.createdAt ? `Latest deploy ${timeAgo(deploy.createdAt)}` : undefined}
      className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </a>
  );
}

function EditorNamePrompt({ open, initial, onSave, onCancel }: { open: boolean; initial: string; onSave: (n: string) => void; onCancel?: () => void }) {
  const [name, setName] = useState(initial);
  const valid = name.trim().length > 0;
  return (
    <Modal
      open={open}
      onClose={() => onCancel?.()}
      title="Who's editing?"
      footer={
        <>
          {onCancel && <Button onClick={onCancel}>Cancel</Button>}
          <Button variant="primary" disabled={!valid} onClick={() => onSave(name.trim())}>
            Continue
          </Button>
        </>
      }
    >
      <p className="mb-3">Your name goes on every change you make, so the team can see who did what. It&apos;s remembered on this device.</p>
      <form onSubmit={(e) => { e.preventDefault(); if (valid) onSave(name.trim()); }}>
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lachlan" maxLength={40} />
      </form>
    </Modal>
  );
}
