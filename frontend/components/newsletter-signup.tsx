import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function NewsletterSignup() {
  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <h3 className="text-2xl font-bold text-foreground mb-1">Stay in the loop</h3>
      <p className="text-muted-foreground mb-6">
        Subscribe to monthly Cardano &amp; blockchain insights curated by community editors.
      </p>
      <form className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          placeholder="you@example.com"
          required
          aria-label="Email"
          className="flex-1 bg-background border-border"
        />
        <Button type="submit" className="sm:w-auto">
          Subscribe
        </Button>
      </form>
    </div>
  );
}
