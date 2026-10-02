import { route } from '../../lib/api';
import { listHistory } from '../../lib/service';

export default route({ GET: async () => ({ publishes: await listHistory() }) });
