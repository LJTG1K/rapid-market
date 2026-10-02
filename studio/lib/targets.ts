// Per-content-type presentation for drafts and changes (tray, history),
// so shared UI doesn't need to know every type.
import { brandDraftLabel, diffBrandDraft } from './brands';
import { diffPicksDraft } from './picks';
import type { Draft, FieldDiff, TargetType } from './types';

export function diffDraft(d: Draft): FieldDiff[] {
  return d.targetType === 'picks' ? diffPicksDraft(d) : diffBrandDraft(d);
}

export function draftLabel(d: Draft): string {
  return d.targetType === 'picks' ? "Gilly's Picks" : brandDraftLabel(d);
}

export function targetHref(type: TargetType, key: string): string {
  return type === 'picks' ? '/picks' : `/brands/${key}`;
}

export function targetLabel(type: TargetType, key: string): string {
  return type === 'picks' ? "Gilly's Picks" : key;
}
