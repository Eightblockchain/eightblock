import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet-context';
import { getArticlesByWallet, upsertUser } from '@/lib/api';

export function useProfile() {
  const { connected, connecting, address, disconnect, wallet } = useWallet();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

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

  useEffect(() => {
    async function fetchUserData() {
      if (address && connected) {
        setLoading(true);
        try {
          // Create/update user in backend
          const userData = await upsertUser({ walletAddress: address });
          setUser(userData);

          // Fetch user's articles
          const userArticles = await getArticlesByWallet(address);
          setArticles(userArticles);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchUserData();
  }, [address, connected]);

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

  // Calculate stats
  const publishedArticles = articles.filter((a) => a.status === 'PUBLISHED');
  const draftArticles = articles.filter((a) => a.status === 'DRAFT');
  const totalViews = articles.reduce((sum, a) => sum + (a._count?.likes || 0), 0);
  const totalLikes = articles.reduce((sum, a) => sum + (a._count?.likes || 0), 0);

  return {
    connected,
    connecting,
    address,
    balance,
    copied,
    isChecking,
    articles,
    loading,
    user,
    stats: {
      views: totalViews,
      likes: totalLikes,
      articles: publishedArticles.length,
      drafts: draftArticles.length,
    },
    copyAddress,
    handleDisconnect,
  };
}
