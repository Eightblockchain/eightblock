import { Router } from 'express';
import articleRoutes from '../routes/article-routes.js';
import commentRoutes from '../routes/comment-routes.js';
import likeRoutes from '../routes/like-routes.js';
import subscriptionRoutes from '../routes/subscription-routes.js';
import tagRoutes from '../routes/tag-routes.js';
import authRoutes from '../routes/auth-routes.js';
import userRoutes from '../routes/user-routes.js';
import viewRoutes from '../routes/view-routes.js';
import uploadRoutes from '../routes/upload-routes.js';
import bookmarkRoutes from '../routes/bookmark-routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/articles/:articleId/comments', commentRoutes);
router.use('/articles/:articleId/likes', likeRoutes);
router.use('/articles', articleRoutes);
router.use('/tags', tagRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/views', viewRoutes);
router.use('/bookmarks', bookmarkRoutes);

export default router;
