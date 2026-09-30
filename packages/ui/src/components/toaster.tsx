'use client';

import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';

import { cn } from '../utils';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  toastTone,
  type ToastVariant,
} from './toast';
import { useToast } from '../hooks/use-toast';

const ICONS: Record<ToastVariant, React.ElementType> = {
  default: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  destructive: CircleAlert,
};

/** Problems stay up longer so there is time to read what went wrong. */
const DURATIONS: Record<ToastVariant, number> = {
  default: 4500,
  success: 4500,
  warning: 6500,
  destructive: 7000,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant = 'default', duration, ...props }) => {
        const tone = toastTone[variant];
        const Icon = ICONS[variant];
        const toastDuration = duration ?? DURATIONS[variant];
        const urgent = variant === 'destructive' || variant === 'warning';

        return (
          <Toast
            key={id}
            variant={variant}
            duration={toastDuration}
            type={urgent ? 'foreground' : 'background'}
            {...props}
          >
            <div className="flex items-start gap-3 py-3.5 pl-4 pr-2.5">
              <Icon
                className={cn('mt-px h-[18px] w-[18px] flex-shrink-0', tone.icon)}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                {title && <ToastTitle className={tone.title}>{title}</ToastTitle>}
                {description && (
                  <ToastDescription className={tone.description}>{description}</ToastDescription>
                )}
                {action && <div className="mt-3">{action}</div>}
              </div>
              <ToastClose className={cn('-mt-1', tone.title)} />
            </div>

            {/* Radix pauses the timer on hover and focus, so the countdown does too. */}
            <div className="absolute inset-x-0 bottom-0 h-0.5" aria-hidden>
              <div
                className={cn(
                  'h-full origin-left group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused]',
                  tone.progress
                )}
                style={{ animation: `toast-progress ${toastDuration}ms linear forwards` }}
              />
            </div>
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
