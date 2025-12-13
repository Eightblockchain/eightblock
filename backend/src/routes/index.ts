import { Router } from 'express';
import articleRoutes from '@/routes/article-routes';
import commentRoutes from '@/routes/comment-routes';
import likeRoutes from '@/routes/like-routes';
import subscriptionRoutes from '@/routes/subscription-routes';
import tagRoutes from '@/routes/tag-routes';
import authRoutes from '@/routes/auth-routes';
import userRoutes from '@/routes/user-routes';
import viewRoutes from '@/routes/view-routes';
import uploadRoutes from '@/routes/upload-routes';
import bookmarkRoutes from '@/routes/bookmark-routes';

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
