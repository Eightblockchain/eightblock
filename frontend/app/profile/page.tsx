'use client';

import { useWallet } from '@/lib/wallet-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, Copy, Check, Edit, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';

// Fake articles for the user
const userArticles = [
  {
    id: '1',
    title: 'Getting Started with Cardano Smart Contracts',
    description:
      'A comprehensive guide to building your first smart contract on Cardano using Plutus.',
    category: 'Blockchain',
    date: 'Nov 28, 2024',
    status: 'published',
    views: 1243,
  },
  {
    id: '2',
    title: 'Understanding ADA Staking Rewards',
    description:
      'Learn how staking works on Cardano and maximize your rewards with these strategies.',
    category: 'DeFi',
    date: 'Dec 2, 2024',
    status: 'published',
    views: 892,
  },
  {
    id: '3',
    title: 'Building NFT Marketplace on Cardano',
    description: 'Step-by-step tutorial for creating an NFT marketplace using Cardano blockchain.',
    category: 'NFT',
    date: 'Dec 5, 2024',
    status: 'draft',
    views: 0,
  },
];

export default function ProfilePage() {
  const { connected, connecting, address, disconnect, wallet } = useWallet();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for wallet to finish attempting reconnection
    if (!connecting) {
      setIsChecking(false);
      if (!connected) {
        router.push('/');
      }
    }
  }, [connected, connecting, router]);

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

  // Show loading state while checking wallet connection
  if (isChecking || connecting) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#080808] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Connecting to wallet...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!connected || !address) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header with Wallet Info */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-[#080808]">My Profile</h1>
            <p className="mt-2 text-gray-600">Manage your wallet and articles</p>
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

        {/* Compact Wallet Info */}
        <Card className="p-4 border-2 border-[#080808]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#080808] rounded-full">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Wallet Address</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-[#080808]">
                    {address?.slice(0, 12)}...{address?.slice(-8)}
                  </code>
                  <Button
                    onClick={copyAddress}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-[#080808]" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            {balance && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Balance</p>
                <p className="text-xl font-bold text-[#080808]">{balance} ADA</p>
              </div>
            )}
            <div className="text-right">
              <p className="text-xs text-gray-500">Network</p>
              <p className="text-sm font-medium text-[#080808]">Cardano Mainnet</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Articles Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#080808]">My Articles</h2>
          <Button className="bg-[#080808] text-white hover:bg-gray-800">
            <Edit className="h-4 w-4 mr-2" />
            New Article
          </Button>
        </div>

        <div className="space-y-4">
          {userArticles.map((article) => (
            <Card key={article.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge
                      variant={article.status === 'published' ? 'default' : 'outline'}
                      className={
                        article.status === 'published'
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'border-[#080808] text-[#080808]'
                      }
                    >
                      {article.status}
                    </Badge>
                    <span className="text-xs text-gray-500">{article.date}</span>
                    {article.status === 'published' && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Eye className="h-3 w-3" />
                        {article.views.toLocaleString()} views
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-[#080808] mb-2">{article.title}</h3>
                  <p className="text-gray-600 mb-3">{article.description}</p>
                  <Badge variant="outline" className="text-xs">
                    {article.category}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-9">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-red-200 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {userArticles.length === 0 && (
          <Card className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Edit className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-[#080808] mb-2">No articles yet</h3>
            <p className="text-gray-600 mb-4">Start writing your first article</p>
            <Button className="bg-[#080808] text-white hover:bg-gray-800">Create Article</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
