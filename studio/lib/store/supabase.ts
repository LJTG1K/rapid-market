// Supabase-backed store. Tables come from ../sql/studio_tables.sql and are
// only ever touched server-side with the service-role key.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Change, Draft, Publish, TargetType } from '../types';
import type { Store } from './index';

type Row = Record<string, any>;

const toDraft = (r: Row): Draft => ({
  id: r.id,
  targetType: r.target_type,
  targetKey: r.target_key,
  op: r.op,
  payload: r.payload,
  base: r.base,
  editorName: r.editor_name,
  overwroteEditor: r.overwrote_editor,
  updatedAt: r.updated_at,
});

const toPublish = (r: Row): Publish => ({
  id: r.id,
  editorName: r.editor_name,
  commitSha: r.commit_sha,
  summary: r.summary,
  createdAt: r.created_at,
  revertOf: r.revert_of,
  revertedBy: r.reverted_by,
});

const toChange = (r: Row): Change => ({
  publishId: r.publish_id,
  targetType: r.target_type,
  targetKey: r.target_key,
  field: r.field,
  oldValue: r.old_value,
  newValue: r.new_value,
});

function check<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data;
}

export class SupabaseStore implements Store {
  readonly mode = 'supabase' as const;
  private db: SupabaseClient;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for STUDIO_STORE=supabase.');
    this.db = createClient(url, key, { auth: { persistSession: false } });
  }

  async listDrafts() {
    const rows = check(await this.db.from('studio_drafts').select('*').order('updated_at', { ascending: false }));
    return (rows ?? []).map(toDraft);
  }

  async getDraft(targetType: TargetType, targetKey: string) {
    const row = check(await this.db.from('studio_drafts').select('*').eq('target_type', targetType).eq('target_key', targetKey).maybeSingle());
    return row ? toDraft(row) : null;
  }

  async putDraft(d: Draft) {
    check(
      await this.db.from('studio_drafts').upsert(
        {
          id: d.id,
          target_type: d.targetType,
          target_key: d.targetKey,
          op: d.op,
          payload: d.payload,
          base: d.base,
          editor_name: d.editorName,
          overwrote_editor: d.overwroteEditor,
          updated_at: d.updatedAt,
        },
        { onConflict: 'target_type,target_key' },
      ),
    );
  }

  async deleteDraft(targetType: TargetType, targetKey: string) {
    check(await this.db.from('studio_drafts').delete().eq('target_type', targetType).eq('target_key', targetKey));
  }

  async deletePublishedDrafts(drafts: Pick<Draft, 'id' | 'updatedAt'>[]) {
    for (const d of drafts) {
      check(await this.db.from('studio_drafts').delete().eq('id', d.id).eq('updated_at', d.updatedAt));
    }
  }

  async insertPublish(p: Publish, changes: Change[]) {
    check(
      await this.db.from('studio_publishes').insert({
        id: p.id,
        editor_name: p.editorName,
        commit_sha: p.commitSha,
        summary: p.summary,
        created_at: p.createdAt,
        revert_of: p.revertOf,
        reverted_by: p.revertedBy,
      }),
    );
    if (changes.length) {
      check(
        await this.db.from('studio_changes').insert(
          changes.map((c) => ({
            publish_id: c.publishId,
            target_type: c.targetType,
            target_key: c.targetKey,
            field: c.field,
            old_value: c.oldValue ?? null,
            new_value: c.newValue ?? null,
          })),
        ),
      );
    }
  }

  async listPublishes(limit: number) {
    const rows = check(await this.db.from('studio_publishes').select('*').order('created_at', { ascending: false }).limit(limit));
    return (rows ?? []).map(toPublish);
  }

  async getChanges(publishId: string) {
    const rows = check(await this.db.from('studio_changes').select('*').eq('publish_id', publishId).order('id'));
    return (rows ?? []).map(toChange);
  }

  async markReverted(publishId: string, revertedBy: string) {
    check(await this.db.from('studio_publishes').update({ reverted_by: revertedBy }).eq('id', publishId));
  }
}
