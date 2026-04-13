'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWallet } from '@/lib/wallet-context';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '../ui/avatar';
import {
  ChevronDown,
  LogOut,
  User,
  Wallet,
  Bookmark,
  FileText,
  PlusCircle,
  Loader2,
  Smartphone,
  Zap,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MobileWalletConnect } from './MobileWalletConnect';

export default function LoginBtn() {
  const { connected, connecting, address, connect, disconnect, availableWallets } = useWallet();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [walletPickerOpen, setWalletPickerOpen] = useState(false);
  const [mobileGuideOpen, setMobileGuideOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingWallet, setPendingWallet] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: profileLoading } = useCurrentUser();
  const userProfile = currentUser
    ? { name: currentUser.name, avatarUrl: currentUser.avatarUrl }
    : null;

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice && isSmallScreen);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  const handleWalletSelect = async (walletName: string) => {
    setPendingWallet(walletName);
    try {
      await connect(walletName);
      // Invalidate the current-user query so LoginBtn re-fetches fresh profile data
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setWalletPickerOpen(false);
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Failed to connect selected wallet:', error);
    } finally {
      setPendingWallet(null);
    }
  };

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    queryClient.setQueryData(['current-user'], null);
  }, [disconnect, queryClient]);

  useEffect(() => {
    if (connected) { setWalletPickerOpen(false); setPendingWallet(null); }
  }, [connected]);

  useEffect(() => {
    const handler = () => handleConnectClick();
    window.addEventListener('open-wallet-picker', handler);
    return () => window.removeEventListener('open-wallet-picker', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, availableWallets]);

  const handleConnectClick = () => {
    if (isMobile && availableWallets.length === 0) { setMobileGuideOpen(true); return; }
    if (availableWallets.length === 0) { setWalletPickerOpen(true); return; }
    if (availableWallets.length === 1) { void handleWalletSelect(availableWallets[0].name); return; }
    setWalletPickerOpen((prev) => !prev);
  };

  // ── Wallet picker dropdown ────────────────────────────────────────────────
  const walletPicker = walletPickerOpen && (
    <div className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-border/60
      bg-card shadow-2xl shadow-black/50 overflow-hidden z-50
      animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="px-4 py-2.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="h-px w-4 bg-primary/50" />
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/60">
            Select Wallet
          </span>
        </div>
      </div>
      <div className="max-h-60 overflow-y-auto p-1.5">
        {availableWallets.length === 0 ? (
          <p className="px-3 py-4 text-[13px] text-muted-foreground/50 text-center leading-relaxed">
            No wallets detected. Install a Cardano wallet extension to continue.
          </p>
        ) : (
          availableWallets.map((wallet) => {
            const isPending = pendingWallet === wallet.name && connecting;
            return (
              <button
                key={wallet.name}
                onClick={() => void handleWalletSelect(wallet.name)}
                disabled={isPending}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3
                  text-foreground/80 hover:bg-card/70 hover:text-foreground
                  transition-all duration-150 ${isPending ? 'opacity-60 cursor-wait' : ''}`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl
                  border border-border/50 bg-background/60">
                  <Wallet className="h-3.5 w-3.5 text-primary/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13px] truncate">{wallet.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground/40">v{wallet.version}</p>
                </div>
                {isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary/70 flex-shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
      <div className="border-t border-border/40 p-2 flex justify-end">
        <button
          onClick={() => setWalletPickerOpen(false)}
          className="px-3 py-1.5 rounded-lg text-[12px] text-muted-foreground/50
            hover:text-foreground/70 hover:bg-card/60 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // ── Connected state ───────────────────────────────────────────────────────
  if (connected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card/40
            px-3 py-1.5 text-foreground/80 hover:border-border hover:bg-card hover:text-foreground
            transition-all duration-150"
        >
          <Avatar
            key={userProfile?.avatarUrl ?? address ?? 'wallet-avatar'}
            src={userProfile?.avatarUrl}
            name={userProfile?.name}
            size="xs"
            className={profileLoading ? 'ring-1 ring-primary/30' : ''}
          />
          <span className="text-[13px] font-semibold max-w-[110px] truncate">
            {profileLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
            ) : (
              userProfile?.name || truncateAddress(address)
            )}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-150
            ${showProfileMenu ? 'rotate-180' : ''}`} />
        </button>

        {showProfileMenu && (
          <div className="absolute right-0 mt-2.5 w-52 rounded-2xl border border-border/60
            bg-card shadow-2xl shadow-black/50 overflow-hidden z-50
            animate-in fade-in slide-in-from-top-2 duration-150">
            {/* address badge */}
            <div className="px-4 py-3 border-b border-border/40">
              <p className="font-mono text-[10px] text-muted-foreground/40 truncate">{address}</p>
            </div>
            <div className="p-1.5 space-y-0.5">
              {[
                { href: '/profile', icon: User, label: 'My Profile' },
                { href: '/profile/articles', icon: FileText, label: 'My Articles' },
                { href: '/articles/new', icon: PlusCircle, label: 'New Article' },
                { href: '/profile/bookmarks', icon: Bookmark, label: 'Bookmarks' },
              ].map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px]
                    text-foreground/70 hover:text-foreground hover:bg-card/70
                    transition-all duration-150"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
                  {label}
                </Link>
              ))}
            </div>
            <div className="border-t border-border/40 p-1.5 space-y-0.5">
              <button
                onClick={async () => {
                  setShowProfileMenu(false);
                  await handleDisconnect();
                  setWalletPickerOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px]
                  text-foreground/60 hover:text-foreground/80 hover:bg-card/70
                  transition-all duration-150"
              >
                <Wallet className="h-3.5 w-3.5 text-muted-foreground/40" />
                Switch Wallet
              </button>
              <button
                onClick={async () => {
                  setShowProfileMenu(false);
                  await handleDisconnect();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px]
                  text-rose-400/70 hover:text-rose-400 hover:bg-rose-400/8
                  transition-all duration-150"
              >
                <LogOut className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          </div>
        )}
        {walletPicker}
      </div>
    );
  }

  // ── Disconnected state — Connect Wallet button ────────────────────────────
  return (
    <>
      <div className="relative">
        <button
          onClick={handleConnectClick}
          disabled={connecting}
          className="group relative flex items-center gap-2 overflow-hidden rounded-xl
            bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground
            shadow-lg shadow-primary/25
            hover:shadow-primary/40 hover:brightness-105
            active:scale-[0.97]
            transition-all duration-150
            disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {/* shimmer sweep */}
          <span className="pointer-events-none absolute inset-0 -translate-x-full
            bg-gradient-to-r from-transparent via-white/20 to-transparent
            group-hover:translate-x-full transition-transform duration-500 ease-in-out" />

          {connecting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
          ) : isMobile && availableWallets.length === 0 ? (
            <Smartphone className="h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <Zap className="h-3.5 w-3.5 flex-shrink-0" />
          )}

          <span>
            {connecting
              ? 'Connecting…'
              : isMobile && availableWallets.length === 0
              ? 'Mobile Wallet'
              : 'Connect Wallet'}
          </span>
        </button>
        {walletPicker}
      </div>

      <Sheet open={mobileGuideOpen} onOpenChange={setMobileGuideOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Connect on Mobile</SheetTitle>
          </SheetHeader>
          <MobileWalletConnect onClose={() => setMobileGuideOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}


