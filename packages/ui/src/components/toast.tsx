import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '../utils';

/** `default` is a neutral notice; the others carry meaning through colour and icon. */
export type ToastVariant = 'default' | 'success' | 'warning' | 'destructive';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-4 right-4 z-[100] flex flex-col gap-2 outline-none',
      'w-[380px] max-w-[calc(100vw-2rem)]',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

export const toastVariants = cva(
  [
    'group pointer-events-auto relative overflow-hidden rounded-none border',
    'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 data-[state=open]:fade-in-0 data-[state=open]:duration-300',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=closed]:duration-200',
    'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
  ],
  {
    variants: {
      variant: {
        default: 'border-border bg-background',
        success:
          'border-emerald-200 bg-emerald-50 dark:border-[hsl(152_45%_18%)] dark:bg-[hsl(152_55%_7%)]',
        warning:
          'border-amber-200 bg-amber-50 dark:border-[hsl(40_55%_20%)] dark:bg-[hsl(40_60%_7%)]',
        destructive:
          'border-red-200 bg-red-50 dark:border-[hsl(0_50%_22%)] dark:bg-[hsl(0_55%_8%)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

/** Icon, title, description and countdown colours per variant. */
export const toastTone: Record<
  ToastVariant,
  { icon: string; title: string; description: string; progress: string }
> = {
  default: {
    icon: 'text-brand-blue',
    title: 'text-foreground',
    description: 'text-muted-foreground',
    progress: 'bg-brand-blue/60',
  },
  success: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-950 dark:text-emerald-50',
    description: 'text-emerald-900/75 dark:text-emerald-100/75',
    progress: 'bg-emerald-600/50 dark:bg-emerald-400/50',
  },
  warning: {
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-950 dark:text-amber-50',
    description: 'text-amber-900/75 dark:text-amber-100/75',
    progress: 'bg-amber-600/50 dark:bg-amber-400/50',
  },
  destructive: {
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-950 dark:text-red-50',
    description: 'text-red-900/75 dark:text-red-100/75',
    progress: 'bg-red-600/50 dark:bg-red-400/50',
  },
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & { variant?: ToastVariant }
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 items-center justify-center border border-foreground/15 px-3',
      'text-xs font-medium transition-colors hover:bg-foreground/5',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full opacity-60',
      'transition-opacity hover:opacity-100 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand-blue',
      className
    )}
    toast-close=""
    aria-label="Dismiss notification"
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold leading-snug', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('mt-1 break-words text-[13px] leading-relaxed', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
