'use client';

import {
  CheckCircle2,
  AlertCircle,
  Info,
  Heart,
  Bookmark,
  MessageCircle,
  Share2,
  Trash2,
  Edit,
  Upload,
} from 'lucide-react';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import type { ToastVariant } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

/** Auto-dismiss duration shared between Radix and the progress bar */
const DURATION = 4500;

type VariantConfig = {
  accent: string;       // left bar + icon ring color class
  iconBg: string;
  iconColor: string;
  progressColor: string;
  icon: React.ElementType;
};

const variantConfig: Record<NonNullable<ToastVariant>, VariantConfig> = {
  default: {
    accent:        'bg-primary',
    iconBg:        'bg-primary/10',
    iconColor:     'text-primary',
    progressColor: 'bg-primary/50',
    icon:          CheckCircle2,
  },
  destructive: {
    accent:        'bg-rose-500',
    iconBg:        'bg-rose-500/10',
    iconColor:     'text-rose-400',
    progressColor: 'bg-rose-500/50',
    icon:          AlertCircle,
  },
};

/** Pick an icon based on the title keyword for richer defaults */
function resolveIcon(title: React.ReactNode, fallback: React.ElementType): React.ElementType {
  if (typeof title !== 'string') return fallback;
  const t = title.toLowerCase();
  if (t.includes('like') || t.includes('heart'))     return Heart;
  if (t.includes('bookmark') || t.includes('saved')) return Bookmark;
  if (t.includes('comment'))                          return MessageCircle;
  if (t.includes('shar'))                             return Share2;
  if (t.includes('delet') || t.includes('remov'))     return Trash2;
  if (t.includes('updat') || t.includes('edit'))      return Edit;
  if (t.includes('publish') || t.includes('upload'))  return Upload;
  if (t.includes('error') || t.includes('fail'))      return AlertCircle;
  if (t.includes('info'))                             return Info;
  return fallback;
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={DURATION}>
      {toasts.map(({ id, title, description, action, variant, duration, ...props }) => {
        const cfg = variantConfig[variant ?? 'default'] ?? variantConfig.default;
        const Icon = resolveIcon(title, cfg.icon);
        const toastDuration = (duration as number | undefined) ?? DURATION;

        return (
          <Toast key={id} variant={variant} duration={toastDuration} {...props}>

            {/* ── Left accent bar ── */}
            <div className={`absolute left-0 inset-y-0 w-[3px] ${cfg.accent} rounded-l-2xl`} />

            {/* ── Main content ── */}
            <div className="flex items-start gap-3 pl-5 pr-3 py-3.5">

              {/* Icon badge */}
              <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl ${cfg.iconBg}`}>
                <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pt-[3px]">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>

              {/* Optional action */}
              {action && <div className="flex-shrink-0 self-center ml-1">{action}</div>}

              {/* Close */}
              <ToastClose className="self-start mt-[1px]" />
            </div>

            {/* ── Progress bar ── */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.04]">
              <div
                className={`h-full ${cfg.progressColor} origin-left`}
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
