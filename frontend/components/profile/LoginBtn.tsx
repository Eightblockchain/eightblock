'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { Button } from '../ui/button';
import { ChevronDown, LogOut, User } from 'lucide-react';

export default function LoginBtn() {
  const { connected, connecting, address, connect, disconnect } = useWallet();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  if (connected && address) {
    return (
      <div className="relative">
        <Button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="bg-[#080808] px-4 text-base hover:bg-[#080808]/90 rounded-[2px] flex items-center gap-2"
        >
          <User className="h-4 w-4" />
          {truncateAddress(address)}
          <ChevronDown className="h-4 w-4" />
        </Button>

        {showProfileMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="py-1">
              <a
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <User className="h-4 w-4" />
                My Profile
              </a>
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
    <Button
      onClick={connect}
      disabled={connecting}
      className="bg-[#080808] px-8 text-base hover:bg-[#080808]/90 rounded-[2px]"
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}
