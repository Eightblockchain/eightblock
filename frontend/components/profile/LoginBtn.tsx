'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/lib/wallet-context';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { ChevronDown, LogOut, User, Wallet, Bookmark, FileText, PlusCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function LoginBtn() {
  const { connected, connecting, address, connect, disconnect, availableWallets } = useWallet();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showWalletSelect, setShowWalletSelect] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    name: string | null;
    avatarUrl: string | null;
  } | null>(null);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  useEffect(() => {
    if (connected && address) {
      fetchUserProfile();
    }
  }, [connected, address]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile({ name: data.name, avatarUrl: data.avatarUrl });
      } else if (response.status === 401) {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const handleWalletSelect = async (walletName: string) => {
    setShowWalletSelect(false);
    await connect(walletName);
  };

  if (connected && address) {
    return (
      <div className="relative">
        <Button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="bg-[#080808] px-4 text-base hover:bg-[#080808]/90 rounded-[2px] flex items-center gap-2"
        >
          <Avatar src={userProfile?.avatarUrl} name={userProfile?.name} size="xs" />
          {userProfile?.name || truncateAddress(address)}
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
                  onClick={() => {
                    setShowProfileMenu(false);
                    disconnect();
                    setShowWalletSelect(true);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  Switch Wallet
                </button>
              )}
              <button
                onClick={() => {
                  disconnect();
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={() => {
          if (availableWallets.length > 1) {
            setShowWalletSelect(!showWalletSelect);
          } else {
            connect();
          }
        }}
        disabled={connecting}
        className="bg-[#080808] px-8 text-base hover:bg-[#080808]/90 rounded-[2px]"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      {showWalletSelect && availableWallets.length > 1 && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Select Wallet</p>
            {availableWallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => handleWalletSelect(wallet.name)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{wallet.name}</p>
                  <p className="text-xs text-gray-500">v{wallet.version}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
