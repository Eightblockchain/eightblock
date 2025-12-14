import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit } from 'lucide-react';

export function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Edit className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">No articles yet</h3>
      <p className="text-gray-600 mb-4">Start writing your first article</p>
      <Button variant="default">Create Article</Button>
    </Card>
  );
}
