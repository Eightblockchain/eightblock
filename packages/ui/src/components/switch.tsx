import { cn } from '../utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  'aria-describedby'?: string;
}

export function Switch({ checked, onChange, id, disabled, ...aria }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'border-brand-blue bg-brand-blue' : 'border-border bg-muted'
      )}
      {...aria}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-background transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

/** A labelled on/off setting: title and explanation on the left, the switch on the right. */
export function SwitchField({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  description: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <p id={`${id}-description`} className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-describedby={`${id}-description`}
      />
    </div>
  );
}
