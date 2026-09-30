import { createRouter } from '../utils/async-router.js';
import { getAuthor } from '../controllers/author-controller.js';

const router = createRouter();

router.get('/:username', getAuthor);

export default router;
