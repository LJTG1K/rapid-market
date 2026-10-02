import { route } from '../../lib/api';
import { getPublishedPicks } from '../../lib/service';

export default route({ GET: async () => ({ config: await getPublishedPicks() }) });
