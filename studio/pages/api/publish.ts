import { route } from '../../lib/api';
import { previewPublish, publish } from '../../lib/service';

export const config = { maxDuration: 60 };

export default route({
  GET: () => previewPublish(),
  POST: (_req, _res, editor) => publish(editor),
});
