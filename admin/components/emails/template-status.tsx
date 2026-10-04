import type { EmailTemplate } from '@/lib/services/email-template-service';
import { cn } from '@eightblock/ui/utils';

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function TemplateStatus({
  template,
}: {
  template: Pick<EmailTemplate, 'customized' | 'updatedAt'>;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        template.customized
          ? 'border-brand-blue/40 text-brand-blue'
          : 'border-border text-muted-foreground'
      )}
    >
      {template.customized && template.updatedAt
        ? `Edited ${shortDate(template.updatedAt)}`
        : 'Default wording'}
    </span>
  );
}
