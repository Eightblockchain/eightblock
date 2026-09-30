'use client';

import { useEffect, useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { cn } from '../utils';

interface ShareButtonProps {
  /** Path or absolute URL to share. Defaults to the current page, including its filters. */
  url?: string;
  title?: string;
  label?: string;
  className?: string;
}

/** Opens the native share sheet on touch devices and copies the link everywhere else. */
export function ShareButton({ url, title, label = 'Share', className }: ShareButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const share = async () => {
    const link = new URL(url ?? window.location.href, window.location.origin).toString();

    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: title ?? document.title, url: link });
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: 'Link copied',
        description: 'Anyone with the link can open it, no sign-in needed.',
        variant: 'success',
      });
    } catch {
      toast({ title: 'Copy this link manually', description: link });
    }
  };

  return (
    <button type="button" onClick={share} className={cn('btn-pill-outline', className)}>
      {copied ? <Check className="h-4 w-4 text-brand-blue" /> : <Share2 className="h-4 w-4" />}
      {copied ? 'Copied' : label}
    </button>
  );
}
