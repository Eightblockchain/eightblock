'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useWallet } from '@/lib/wallet-context';
import { Button } from '../ui/button';
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
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function LoginBtn() {
  const { connected, connecting, address, connect, disconnect, availableWallets } = useWallet();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [walletPickerOpen, setWalletPickerOpen] = useState(false);
  const [pendingWallet, setPendingWallet] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{
    name: string | null;
    avatarUrl: string | null;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileRequestRef = useRef<AbortController | null>(null);
  const skipEffectFetchRef = useRef(false);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  const fetchUserProfile = useCallback(async () => {
    profileRequestRef.current?.abort();
    const controller = new AbortController();
    profileRequestRef.current = controller;
    setProfileLoading(true);

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile({ name: data.name, avatarUrl: data.avatarUrl });
        return;
      }

      if (response.status === 401) {
        setUserProfile(null);
        return;
      }

      const errorText = await response.text();
      console.error('Failed to fetch user profile:', errorText);
      setUserProfile(null);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('Failed to fetch user profile:', error);
      setUserProfile(null);
    } finally {
      if (profileRequestRef.current === controller) {
        setProfileLoading(false);
        profileRequestRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (connected && address) {
      if (skipEffectFetchRef.current) {
        skipEffectFetchRef.current = false;
        return;
      }
      void fetchUserProfile();
    } else if (!connected) {
      profileRequestRef.current?.abort();
      profileRequestRef.current = null;
      setProfileLoading(false);
      setUserProfile(null);
    }
  }, [connected, address, fetchUserProfile]);

  useEffect(() => {
    return () => {
      profileRequestRef.current?.abort();
    };
  }, []);

  const handleWalletSelect = async (walletName: string) => {
    setPendingWallet(walletName);
    setUserProfile(null);
    profileRequestRef.current?.abort();
    skipEffectFetchRef.current = true;
    try {
      await connect(walletName);
      await fetchUserProfile();
      setWalletPickerOpen(false);
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Failed to connect selected wallet:', error);
    } finally {
      setPendingWallet(null);
      skipEffectFetchRef.current = false;
    }
  };

  const handleDisconnect = useCallback(async () => {
    profileRequestRef.current?.abort();
    profileRequestRef.current = null;
    skipEffectFetchRef.current = false;
    setProfileLoading(false);
    setUserProfile(null);
    await disconnect();
  }, [disconnect]);

  useEffect(() => {
    if (connected) {
      setWalletPickerOpen(false);
      setPendingWallet(null);
    }
  }, [connected]);

  const handleConnectClick = () => {
    if (availableWallets.length === 0) {
      setWalletPickerOpen(true);
      return;
    }

    if (availableWallets.length === 1) {
      void handleWalletSelect(availableWallets[0].name);
      return;
    }

    setWalletPickerOpen((prev) => !prev);
  };

  const walletPicker = walletPickerOpen && (
    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-2xl z-50">
      <div className="px-3 py-2 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
        Select Wallet
      </div>
      <div className="max-h-64 overflow-y-auto">
        {availableWallets.length === 0 ? (
          <p className="px-3 py-4 text-sm text-gray-500">
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
                className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-3 text-gray-700 hover:bg-gray-100 ${
                  isPending ? 'opacity-60 cursor-wait' : ''
                }`}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{wallet.name}</p>
                  <p className="text-xs text-gray-500">v{wallet.version}</p>
                </div>
                {isPending && <span className="text-xs text-gray-500">Connecting...</span>}
              </button>
            );
          })
        )}
      </div>
      <div className="border-t border-gray-100 p-2 flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setWalletPickerOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );

  if (connected && address) {
    return (
      <div className="relative">
        <Button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="bg-[#080808] px-4 text-base hover:bg-[#080808]/90 rounded-[2px] flex items-center gap-2"
        >
          <Avatar
            key={userProfile?.avatarUrl ?? address ?? 'wallet-avatar'}
            src={userProfile?.avatarUrl}
            name={userProfile?.name}
            size="xs"
            className={profileLoading ? 'ring-1 ring-white/20' : ''}
          />
          <span className="flex items-center gap-2">
            {userProfile?.name || truncateAddress(address)}
            {profileLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>

        {showProfileMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="py-1">
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setShowProfileMenu(false)}
              >
                <User className="h-4 w-4" />
                My Profile
              </Link>
              <Link
                href="/profile/articles"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setShowProfileMenu(false)}
              >
                <FileText className="h-4 w-4" />
                My Articles
              </Link>
              <Link
                href="/articles/new"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setShowProfileMenu(false)}
              >
                <PlusCircle className="h-4 w-4" />
                New Article
              </Link>
              <Link
                href="/profile/bookmarks"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setShowProfileMenu(false)}
              >
                <Bookmark className="h-4 w-4" />
                Bookmarks
              </Link>
              <div className="border-t border-gray-200 my-1"></div>
              {availableWallets.length > 1 && (
                <button
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await handleDisconnect();
                    setWalletPickerOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  Switch Wallet
                </button>
              )}
              <button
                onClick={async () => {
                  setShowProfileMenu(false);
                  await handleDisconnect();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </div>
        )}

        {walletPicker}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={handleConnectClick}
        disabled={connecting}
        className="bg-[#080808] px-8 text-base hover:bg-[#080808]/90 rounded-[2px]"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      {walletPicker}
    </div>
  );
}
