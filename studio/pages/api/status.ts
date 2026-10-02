import { route } from '../../lib/api';
import { getContent } from '../../lib/content';
import { getStore } from '../../lib/store';
import { getDeployStatus } from '../../lib/vercel';

export default route({
  GET: async () => ({
    contentMode: getContent().mode,
    storeMode: getStore().mode,
    deploy: await getDeployStatus(),
  }),
});
