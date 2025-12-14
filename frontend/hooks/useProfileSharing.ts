import { useToast } from '@/hooks/use-toast';

interface UseProfileSharingOptions {
  walletAddress?: string;
  profileName?: string | null;
}

export function useProfileSharing({ walletAddress, profileName }: UseProfileSharingOptions) {
  const toast = useToast?.() || { toast: () => {} };

  const shareProfile = async () => {
    if (!walletAddress) return;
    const shareUrl = `${window.location.origin}/profile/${walletAddress}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: profileName ? `${profileName} · EightBlock` : 'EightBlock Creator',
          text: 'Check out this EightBlock creator profile',
          url: shareUrl,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.toast?.({
          title: 'Profile link copied',
          description: 'Public profile URL copied to your clipboard.',
        });
        return;
      }

      throw new Error('Clipboard unavailable');
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      toast.toast?.({
        title: 'Unable to share',
        description: 'Copy the link manually if native sharing is unavailable.',
        variant: 'destructive',
      });
    }
  };

  const copyWalletAddress = () => {
    if (!walletAddress) return;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(walletAddress)
        .then(() =>
          toast.toast?.({
            title: 'Wallet copied',
            description: 'Wallet address copied to clipboard.',
          })
        )
        .catch(() =>
          toast.toast?.({
            title: 'Copy failed',
            description: 'Unable to copy wallet address right now.',
            variant: 'destructive',
          })
        );
    } else {
      toast.toast?.({
        title: 'Clipboard unavailable',
        description: walletAddress,
      });
    }
  };

  return { shareProfile, copyWalletAddress };
}
