import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NewsletterSignup() {
  return (
    <Card className="border-primary/20 bg-secondary/40">
      <CardHeader>
        <CardTitle>Stay in the loop</CardTitle>
        <CardDescription>
          Subscribe to monthly Cardano & blockchain insights curated by community editors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-3 sm:flex-row">
          <Input type="email" placeholder="you@example.com" required aria-label="Email" />
          <Button type="submit">Subscribe</Button>
        </form>
      </CardContent>
    </Card>
  );
}
