import { route } from '../../lib/api';
import { getPublishedBrands } from '../../lib/service';
import { getStore } from '../../lib/store';

// Published brands plus every pending draft; the UI merges them.
export default route({
  GET: async () => {
    const [{ brands }, drafts] = await Promise.all([getPublishedBrands(), getStore().listDrafts()]);
    return { brands, drafts };
  },
});
