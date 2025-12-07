'use client';

import { useWallet } from '@/lib/wallet-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function ProfilePage() {
  const { connected, address, disconnect, wallet } = useWallet();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  useEffect(() => {
    async function fetchBalance() {
      if (wallet) {
        try {
          const lovelace = await wallet.getLovelace();
          const ada = (parseInt(lovelace) / 1_000_000).toFixed(2);
          setBalance(ada);
        } catch (error) {
          console.error('Failed to fetch balance:', error);
        }
      }
    }
    fetchBalance();
  }, [wallet]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    router.push('/');
  };

  if (!connected || !address) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#080808]">My Profile</h1>
        <p className="mt-2 text-gray-600">Manage your wallet and account settings</p>
      </div>

      {/* Wallet Card */}
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#080808] rounded-full">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#080808]">Connected Wallet</h2>
              <p className="text-sm text-gray-500">Cardano Mainnet</p>
            </div>
          </div>
          <Button
            onClick={handleDisconnect}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          {/* Address */}
          <div>
            <label className="text-sm font-medium text-gray-500">Wallet Address</label>
            <div className="mt-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <code className="flex-1 text-sm font-mono text-[#080808] break-all">{address}</code>
              <Button onClick={copyAddress} variant="ghost" size="sm" className="flex-shrink-0">
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Balance */}
          {balance && (
            <div>
              <label className="text-sm font-medium text-gray-500">Balance</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-[#080808]">{balance} ADA</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Additional Info */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-[#080808] mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">Network</span>
            <span className="font-medium text-[#080808]">Cardano Mainnet</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">Wallet Type</span>
            <span className="font-medium text-[#080808]">Browser Extension</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Status</span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 bg-green-500 rounded-full"></span>
              <span className="font-medium text-green-600">Connected</span>
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
