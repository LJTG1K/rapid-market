import { route } from '../../lib/api';
import { PICKS_KEY } from '../../lib/picks';
import { UserError, saveBrandDraft, savePicksDraft } from '../../lib/service';
import { getStore } from '../../lib/store';

export default route({
  GET: async () => ({ drafts: await getStore().listDrafts() }),
  PUT: async (req, _res, editor) => {
    const { targetType, op, targetKey, payload, previousKey } = req.body ?? {};
    if (targetType === 'picks') return { draft: await savePicksDraft(payload ?? {}, editor) };
    if (targetType !== 'brand') throw new UserError('Unknown content type.');
    if (!['create', 'update', 'delete'].includes(op) || typeof targetKey !== 'string' || !targetKey) {
      throw new UserError('Invalid draft.');
    }
    const draft = await saveBrandDraft({ op, targetKey, payload, previousKey }, editor);
    return { draft };
  },
  DELETE: async (req) => {
    const { targetType, targetKey } = req.query;
    if (targetType === 'picks') {
      await getStore().deleteDraft('picks', PICKS_KEY);
      return { ok: true };
    }
    if (targetType !== 'brand' || typeof targetKey !== 'string') throw new UserError('Invalid draft.');
    await getStore().deleteDraft('brand', targetKey);
    return { ok: true };
  },
});
