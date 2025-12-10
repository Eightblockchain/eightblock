'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { deleteArticle } from '@/lib/api';

interface ArticleCardProps {
  article: any;
  onDelete?: () => void;
}

export function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteArticle(article.id);
      setOpen(false);
      toast({
        title: 'Article deleted',
        description: 'Your article has been successfully deleted.',
      });
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Failed to delete article:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete article. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge
              variant={article.status === 'PUBLISHED' ? 'default' : 'outline'}
              className={
                article.status === 'PUBLISHED'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'border-[#080808] text-[#080808]'
              }
            >
              {article.status}
            </Badge>
            <span className="text-xs text-gray-500">{formatDate(article.publishedAt)}</span>
            {article.status === 'PUBLISHED' && article._count?.likes > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Eye className="h-3 w-3" />
                {article._count.likes} likes
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-[#080808] mb-2">{article.title}</h3>
          <p className="text-gray-600 mb-3">{article.description}</p>
          <Badge variant="outline" className="text-xs">
            {article.category}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => router.push(`/articles/${article.slug}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-red-200 text-red-500 hover:bg-red-50"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <AlertDialogTitle className="text-xl">Delete Article</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-base">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-gray-700">&ldquo;{article.title}&rdquo;</span>
                  ?
                  <br />
                  <br />
                  This action cannot be undone. The article and all associated data will be
                  permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Article'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}
