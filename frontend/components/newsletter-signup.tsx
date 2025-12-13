import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NewsletterSignup() {
  return (
    <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-white shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl text-foreground">Stay in the loop</CardTitle>
        <CardDescription className="text-muted-foreground">
          Subscribe to monthly Cardano & blockchain insights curated by community editors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="email"
            placeholder="you@example.com"
            required
            aria-label="Email"
            className="flex-1"
          />
          <Button type="submit" className="sm:w-auto">
            Subscribe
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
