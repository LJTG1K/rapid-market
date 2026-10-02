import { route } from '../../lib/api';
import { getProducts } from '../../lib/products';

export default route({ GET: () => getProducts() });
