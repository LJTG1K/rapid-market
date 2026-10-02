import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getEditorName, setEditorNameStored } from '../lib/client';
import type { Draft } from '../lib/types';
import type { DeployStatus } from '../lib/vercel';

interface Status {
  contentMode: 'github' | 'local';
  storeMode: 'local' | 'supabase';
  deploy: DeployStatus;
}

interface StudioState {
  drafts: Draft[];
  refreshDrafts: () => Promise<void>;
  status: Status | null;
  refreshStatus: () => Promise<void>;
  /** null until read from localStorage, so the name prompt never flashes. */
  editorName: string | null;
  setEditorName: (name: string) => void;
  trayOpen: boolean;
  setTrayOpen: (open: boolean) => void;
  toast: string | null;
  showToast: (msg: string) => void;
  /** Bumped after every publish/revert so pages re-read the published files. */
  contentVersion: number;
  bumpContent: () => void;
}

const Ctx = createContext<StudioState | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [editorName, setName] = useState<string | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [contentVersion, setContentVersion] = useState(0);
  const bumpContent = useCallback(() => setContentVersion((v) => v + 1), []);

  const refreshDrafts = useCallback(async () => {
    const { drafts } = await api<{ drafts: Draft[] }>('/api/drafts');
    setDrafts(drafts);
  }, []);
  const refreshStatus = useCallback(async () => {
    setStatus(await api<Status>('/api/status'));
  }, []);

  useEffect(() => {
    setName(getEditorName());
    refreshDrafts().catch(() => {});
    refreshStatus().catch(() => {});
    // Teammates share one queue, so keep it fresh while the tab is open.
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') refreshDrafts().catch(() => {});
    }, 20_000);
    return () => clearInterval(t);
  }, [refreshDrafts, refreshStatus]);

  // Poll faster while a deploy is in flight.
  useEffect(() => {
    if (status?.deploy.state !== 'deploying') return;
    const t = setTimeout(() => refreshStatus().catch(() => {}), 8_000);
    return () => clearTimeout(t);
  }, [status, refreshStatus]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 3500);
  }, []);

  const setEditorName = useCallback((name: string) => {
    setEditorNameStored(name);
    setName(name);
  }, []);

  return (
    <Ctx.Provider value={{ drafts, refreshDrafts, status, refreshStatus, editorName, setEditorName, trayOpen, setTrayOpen, toast, showToast, contentVersion, bumpContent }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStudio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStudio outside StudioProvider');
  return ctx;
}
