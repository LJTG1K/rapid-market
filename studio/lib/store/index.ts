// Drafts + publish history. "local" keeps everything in studio/.data/store.json
// for development; "supabase" is the shared store the deployed app uses.
import type { Change, Draft, Publish, TargetType } from '../types';
import { LocalStore } from './local';
import { SupabaseStore } from './supabase';

export interface Store {
  readonly mode: 'local' | 'supabase';
  listDrafts(): Promise<Draft[]>;
  getDraft(targetType: TargetType, targetKey: string): Promise<Draft | null>;
  putDraft(draft: Draft): Promise<void>;
  deleteDraft(targetType: TargetType, targetKey: string): Promise<void>;
  /** Deletes drafts only if they haven't been re-saved since (matching updatedAt). */
  deletePublishedDrafts(drafts: Pick<Draft, 'id' | 'updatedAt'>[]): Promise<void>;
  insertPublish(publish: Publish, changes: Change[]): Promise<void>;
  listPublishes(limit: number): Promise<Publish[]>;
  getChanges(publishId: string): Promise<Change[]>;
  markReverted(publishId: string, revertedBy: string): Promise<void>;
}

let instance: Store | null = null;

export function getStore(): Store {
  if (instance) return instance;
  const mode = process.env.STUDIO_STORE || (process.env.VERCEL ? 'supabase' : 'local');
  if (mode === 'supabase') instance = new SupabaseStore();
  else if (process.env.VERCEL) throw new Error('STUDIO_STORE=local is for development only; use supabase on Vercel.');
  else instance = new LocalStore();
  return instance;
}
