// Server-side orchestration: drafts, publish preview, publish and revert.
// Everything here runs in API routes only.
import { randomUUID } from 'crypto';
import {
  BRANDS_PATH,
  RESERVED_SLUG_LIST,
  SLUG_RE,
  applyDrafts,
  eq,
  normalizeBrand,
  revertChanges,
  serializeBrands,
  summarizeChanges,
  validateBrands,
  type ChangeInput,
} from './brands';
import { StaleHeadError, getContent, type Snapshot } from './content';
import { PICKS_KEY, PICKS_PATH, applyPicksDraft, normalizePicks, revertPicks, serializePicks, validatePicks } from './picks';
import { getStore } from './store';
import type { Brand, BrandDraft, Change, Draft, DraftOp, PicksConfig, PicksDraft, Publish, TargetType } from './types';

export class UserError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

async function readBrands(snap: Snapshot): Promise<Brand[]> {
  return JSON.parse(await snap.read(BRANDS_PATH));
}

async function readPicks(snap: Snapshot): Promise<PicksConfig> {
  return normalizePicks(JSON.parse(await snap.read(PICKS_PATH)));
}

// Short cache so typing-speed saves don't hammer the GitHub API.
let publishedCache: { at: number; snap: Snapshot; brands?: Brand[]; picks?: PicksConfig } | null = null;

async function publishedSnapshot(fresh: boolean) {
  if (fresh || !publishedCache || Date.now() - publishedCache.at > 15_000) {
    publishedCache = { at: Date.now(), snap: await getContent().snapshot() };
  }
  return publishedCache;
}

export async function getPublishedBrands(fresh = false): Promise<{ brands: Brand[] }> {
  const c = await publishedSnapshot(fresh);
  c.brands ??= await readBrands(c.snap);
  return { brands: c.brands };
}

export async function getPublishedPicks(fresh = false): Promise<PicksConfig> {
  const c = await publishedSnapshot(fresh);
  c.picks ??= await readPicks(c.snap);
  return c.picks;
}

function overwrote(existing: Draft | null, editorName: string) {
  return existing && existing.editorName !== editorName ? existing.editorName : existing?.overwroteEditor ?? null;
}

export interface SaveDraftInput {
  op: DraftOp;
  targetKey: string;
  payload?: Partial<Brand>;
  /** For a not-yet-published brand whose slug changed while drafting. */
  previousKey?: string;
}

export async function saveBrandDraft(input: SaveDraftInput, editorName: string): Promise<Draft | null> {
  const store = getStore();
  const { brands: published } = await getPublishedBrands();
  const publishedRecord = published.find((b) => b.slug === input.targetKey) ?? null;
  const existing = (await store.getDraft('brand', input.targetKey)) as BrandDraft | null;
  const now = new Date().toISOString();
  const overwroteEditor = overwrote(existing, editorName);

  if (input.op === 'delete') {
    if (existing?.op === 'create') {
      await store.deleteDraft('brand', input.targetKey);
      return null;
    }
    if (!publishedRecord) throw new UserError(`No published brand "${input.targetKey}" to delete.`, 404);
    const draft: BrandDraft = {
      id: existing?.id ?? randomUUID(),
      targetType: 'brand',
      targetKey: input.targetKey,
      op: 'delete',
      payload: null,
      base: existing?.base ?? publishedRecord,
      editorName,
      overwroteEditor,
      updatedAt: now,
    };
    await store.putDraft(draft);
    return draft;
  }

  const payload = normalizeBrand({ ...(input.payload ?? {}), slug: input.targetKey });
  if (!SLUG_RE.test(payload.slug) || RESERVED_SLUG_LIST.includes(payload.slug)) {
    throw new UserError(`"${payload.slug}" isn't a valid slug. Use lowercase letters, numbers and hyphens.`);
  }

  const isCreate = input.op === 'create' || existing?.op === 'create';
  if (isCreate) {
    if (publishedRecord) throw new UserError(`A published brand already uses the slug "${payload.slug}".`, 409);
    if (input.previousKey && input.previousKey !== input.targetKey) {
      const prev = await store.getDraft('brand', input.previousKey);
      if (prev && prev.op !== 'create') throw new UserError('Slugs are locked once a brand is published.', 409);
      if (existing && existing.op !== 'create') throw new UserError(`Slug "${payload.slug}" is taken.`, 409);
      await store.deleteDraft('brand', input.previousKey);
    } else if (existing && existing.op !== 'create') {
      throw new UserError(`Slug "${payload.slug}" is taken.`, 409);
    }
    const draft: BrandDraft = {
      id: existing?.id ?? randomUUID(),
      targetType: 'brand',
      targetKey: payload.slug,
      op: 'create',
      payload,
      base: null,
      editorName,
      overwroteEditor,
      updatedAt: now,
    };
    await store.putDraft(draft);
    return draft;
  }

  if (!publishedRecord) throw new UserError(`No published brand "${input.targetKey}".`, 404);
  const base = existing?.base ?? publishedRecord;
  // Editing a field back to its published value removes the draft entirely.
  if (eq(normalizeBrand(base), payload)) {
    if (existing) await store.deleteDraft('brand', input.targetKey);
    return null;
  }
  const draft: BrandDraft = {
    id: existing?.id ?? randomUUID(),
    targetType: 'brand',
    targetKey: input.targetKey,
    op: 'update',
    payload: { ...base, ...payload },
    base,
    editorName,
    overwroteEditor,
    updatedAt: now,
  };
  await store.putDraft(draft);
  return draft;
}

export async function savePicksDraft(input: Partial<Record<keyof PicksConfig, unknown>>, editorName: string): Promise<Draft | null> {
  const store = getStore();
  const payload = normalizePicks(input);
  const errors = validatePicks(payload);
  if (errors.length) throw new UserError(errors.join('\n'));
  const existing = (await store.getDraft('picks', PICKS_KEY)) as PicksDraft | null;
  const base = existing?.base ?? (await getPublishedPicks());
  if (eq(base, payload)) {
    if (existing) await store.deleteDraft('picks', PICKS_KEY);
    return null;
  }
  const draft: PicksDraft = {
    id: existing?.id ?? randomUUID(),
    targetType: 'picks',
    targetKey: PICKS_KEY,
    op: 'update',
    payload,
    base,
    editorName,
    overwroteEditor: overwrote(existing, editorName),
    updatedAt: new Date().toISOString(),
  };
  await store.putDraft(draft);
  return draft;
}

interface FileChange {
  path: string;
  content: string;
}

interface Built {
  files: FileChange[];
  changes: ChangeInput[];
  errors: string[];
  warnings: string[];
  skipped: string[];
  names: Map<string, string>;
}

/**
 * Applies every pending draft to the files at `snap`: field-level, onto what
 * is published *now*, so upstream edits to untouched fields survive. Only
 * files that actually change are returned.
 */
async function buildPublish(snap: Snapshot, drafts: Draft[]): Promise<Built> {
  const out: Built = { files: [], changes: [], errors: [], warnings: [], skipped: [], names: new Map() };
  const brandDrafts = drafts.filter((d): d is BrandDraft => d.targetType === 'brand');
  const picksDraft = drafts.find((d): d is PicksDraft => d.targetType === 'picks');

  if (brandDrafts.length) {
    const current = await readBrands(snap);
    const r = applyDrafts(current, brandDrafts);
    out.errors.push(...r.errors, ...(r.errors.length ? [] : validateBrands(r.brands)));
    out.warnings.push(...r.warnings);
    out.changes.push(...r.changes);
    [...current, ...r.brands].forEach((b) => out.names.set(b.slug, b.brandName));
    if (r.changes.length) out.files.push({ path: BRANDS_PATH, content: serializeBrands(r.brands) });
  }
  if (picksDraft) {
    const r = applyPicksDraft(await readPicks(snap), picksDraft);
    out.errors.push(...validatePicks(r.config));
    out.warnings.push(...r.warnings);
    out.changes.push(...r.changes);
    if (r.changes.length) out.files.push({ path: PICKS_PATH, content: serializePicks(r.config) });
  }
  return out;
}

/** Inverse of a publish's changes, file by file, skipping anything edited since. */
async function buildRevert(snap: Snapshot, changes: Change[]): Promise<Built> {
  const out: Built = { files: [], changes: [], errors: [], warnings: [], skipped: [], names: new Map() };
  const types = new Set<TargetType>(changes.map((c) => c.targetType));
  if (types.has('brand')) {
    const current = await readBrands(snap);
    const r = revertChanges(current, changes);
    out.changes.push(...r.applied);
    out.skipped.push(...r.skipped);
    out.errors.push(...validateBrands(r.brands));
    [...current, ...r.brands].forEach((b) => out.names.set(b.slug, b.brandName));
    if (r.applied.length) out.files.push({ path: BRANDS_PATH, content: serializeBrands(r.brands) });
  }
  if (types.has('picks')) {
    const r = revertPicks(await readPicks(snap), changes);
    out.changes.push(...r.applied);
    out.skipped.push(...r.skipped);
    out.errors.push(...validatePicks(r.config));
    if (r.applied.length) out.files.push({ path: PICKS_PATH, content: serializePicks(r.config) });
  }
  return out;
}

function newTags(published: Brand[], drafts: Draft[]): string[] {
  const known = new Set(published.flatMap((b) => b.aesthetic));
  const fresh = new Set<string>();
  drafts.forEach((d) => d.targetType === 'brand' && d.payload?.aesthetic.forEach((t) => !known.has(t) && fresh.add(t)));
  return Array.from(fresh);
}

export async function previewPublish() {
  const drafts = await getStore().listDrafts();
  const { snap } = await publishedSnapshot(true);
  const built = await buildPublish(snap, drafts);
  const hasBrands = drafts.some((d) => d.targetType === 'brand');
  return {
    drafts,
    errors: built.errors,
    warnings: built.warnings,
    newTags: hasBrands ? newTags(await readBrands(snap), drafts) : [],
    changeCount: built.changes.length,
  };
}

/**
 * One commit for the whole build, made on top of the snapshot it was built
 * from; if `main` moved meanwhile, rebuild on the new head and retry.
 */
async function commitBuilt(build: (snap: Snapshot) => Promise<Built>, message: (summary: string) => string) {
  const content = getContent();
  for (let attempt = 0; attempt < 3; attempt++) {
    const snap = await content.snapshot();
    const built = await build(snap);
    if (built.errors.length) throw new UserError(`Validation failed:\n${built.errors.join('\n')}`);
    if (!built.files.length) return { sha: null, built, summary: 'No changes' };
    const summary = summarizeChanges(built.changes, built.names);
    try {
      const sha = await content.commit(snap.sha, built.files, message(summary));
      publishedCache = null;
      return { sha, built, summary };
    } catch (e) {
      if (e instanceof StaleHeadError && attempt < 2) continue;
      throw e;
    }
  }
  throw new UserError('Someone else kept publishing at the same moment. Try again.', 409);
}

export async function publish(editorName: string) {
  const store = getStore();
  const drafts = await store.listDrafts();
  if (!drafts.length) throw new UserError('Nothing to publish.');

  const result = await commitBuilt(
    (snap) => buildPublish(snap, drafts),
    (summary) => `Studio: ${summary}\n\nPublished by ${editorName} via RAPID Studio.`,
  );
  if (!result.sha) {
    await store.deletePublishedDrafts(drafts);
    return { publish: null, commitUrl: null, summary: 'No changes: the drafts already match what is live.' };
  }

  const record: Publish = {
    id: randomUUID(),
    editorName,
    commitSha: result.sha,
    summary: result.summary,
    createdAt: new Date().toISOString(),
    revertOf: null,
    revertedBy: null,
  };
  await store.insertPublish(record, result.built.changes.map((c) => ({ ...c, publishId: record.id })));
  await store.deletePublishedDrafts(drafts);
  return { publish: record, commitUrl: getContent().commitUrl(result.sha), summary: result.summary };
}

export async function listHistory() {
  const store = getStore();
  const publishes = await store.listPublishes(50);
  return Promise.all(publishes.map(async (p) => ({ ...p, changes: await store.getChanges(p.id), commitUrl: getContent().commitUrl(p.commitSha) })));
}

/** Undo the most recent publish (git files + change log), skipping anything edited since. */
export async function revertLatest(publishId: string, editorName: string) {
  const store = getStore();
  const [latest] = await store.listPublishes(1);
  if (!latest || latest.id !== publishId) throw new UserError('Only the most recent publish can be reverted.', 409);
  if (latest.revertedBy) throw new UserError('That publish has already been reverted.', 409);
  const changes = await store.getChanges(publishId);

  const result = await commitBuilt(
    (snap) => buildRevert(snap, changes),
    (summary) => `Studio: revert "${latest.summary}"\n\n${summary}\n\nReverted by ${editorName} via RAPID Studio.`,
  );
  if (!result.sha) return { publish: null, skipped: result.built.skipped, commitUrl: null };

  const record: Publish = {
    id: randomUUID(),
    editorName,
    commitSha: result.sha,
    summary: `Revert: ${latest.summary}`,
    createdAt: new Date().toISOString(),
    revertOf: latest.id,
    revertedBy: null,
  };
  await store.insertPublish(record, result.built.changes.map((c) => ({ ...c, publishId: record.id })));
  await store.markReverted(latest.id, record.id);
  return { publish: record, skipped: result.built.skipped, commitUrl: getContent().commitUrl(result.sha) };
}
