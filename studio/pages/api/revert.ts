import { route } from '../../lib/api';
import { UserError, revertLatest } from '../../lib/service';

export const config = { maxDuration: 60 };

export default route({
  POST: async (req, _res, editor) => {
    const id = req.body?.publishId;
    if (typeof id !== 'string') throw new UserError('publishId is required.');
    return revertLatest(id, editor);
  },
});
