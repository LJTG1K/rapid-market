import fs from 'fs';
import path from 'path';
import type { Change, Draft, Publish, TargetType } from '../types';
import type { Store } from './index';

interface Data {
  drafts: Draft[];
  publishes: Publish[];
  changes: Change[];
}

const FILE = path.join(process.cwd(), '.data', 'store.json');

export class LocalStore implements Store {
  readonly mode = 'local' as const;

  private read(): Data {
    try {
      return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    } catch {
      return { drafts: [], publishes: [], changes: [] };
    }
  }

  private write(data: Data) {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  }

  async listDrafts() {
    return this.read().drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getDraft(targetType: TargetType, targetKey: string) {
    return this.read().drafts.find((d) => d.targetType === targetType && d.targetKey === targetKey) ?? null;
  }

  async putDraft(draft: Draft) {
    const data = this.read();
    data.drafts = data.drafts.filter((d) => !(d.targetType === draft.targetType && d.targetKey === draft.targetKey));
    data.drafts.push(draft);
    this.write(data);
  }

  async deleteDraft(targetType: TargetType, targetKey: string) {
    const data = this.read();
    data.drafts = data.drafts.filter((d) => !(d.targetType === targetType && d.targetKey === targetKey));
    this.write(data);
  }

  async deletePublishedDrafts(drafts: Pick<Draft, 'id' | 'updatedAt'>[]) {
    const data = this.read();
    data.drafts = data.drafts.filter((d) => !drafts.some((p) => p.id === d.id && p.updatedAt === d.updatedAt));
    this.write(data);
  }

  async insertPublish(publish: Publish, changes: Change[]) {
    const data = this.read();
    data.publishes.push(publish);
    data.changes.push(...changes);
    this.write(data);
  }

  async listPublishes(limit: number) {
    return this.read()
      .publishes.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async getChanges(publishId: string) {
    return this.read().changes.filter((c) => c.publishId === publishId);
  }

  async markReverted(publishId: string, revertedBy: string) {
    const data = this.read();
    const p = data.publishes.find((x) => x.id === publishId);
    if (p) p.revertedBy = revertedBy;
    this.write(data);
  }
}
