import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet-context';
import { getArticlesByWallet, upsertUser } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function useProfile() {
  const { connected, connecting, address, disconnect, wallet } = useWallet();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [allStats, setAllStats] = useState({
    published: 0,
    drafts: 0,
    totalLikes: 0,
    totalViews: 0,
    totalUniqueViews: 0,
  });

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

  // Query for articles with pagination
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['profile-articles', address, currentPage],
    queryFn: async () => {
      if (!address)
        return { articles: [], pagination: { hasMore: false, page: 1, total: 0, totalPages: 0 } };
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
      const response = await fetch(
        `${API_URL}/articles/wallet/${address}?page=${currentPage}&limit=10`
      );
      if (!response.ok) throw new Error('Failed to fetch articles');
      return response.json();
    },
    enabled: !!address && connected,
  });

  const articles = data?.articles ?? [];
  const pagination = data?.pagination ?? { page: 1, totalPages: 0, total: 0 };

  // Fetch all articles stats (without pagination) for accurate stats display
  useEffect(() => {
    async function fetchAllStats() {
      if (address && connected) {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
          const response = await fetch(`${API_URL}/articles/wallet/${address}?page=1&limit=1000`);
          if (response.ok) {
            const data = await response.json();
            const allArticles = data.articles || [];
            const published = allArticles.filter((a: any) => a.status === 'PUBLISHED').length;
            const drafts = allArticles.filter((a: any) => a.status === 'DRAFT').length;
            const totalLikes = allArticles.reduce(
              (sum: number, a: any) => sum + (a._count?.likes || 0),
              0
            );
            const totalViews = allArticles.reduce(
              (sum: number, a: any) => sum + (a.viewCount || 0),
              0
            );
            const totalUniqueViews = allArticles.reduce(
              (sum: number, a: any) => sum + (a.uniqueViews || 0),
              0
            );
            setAllStats({ published, drafts, totalLikes, totalViews, totalUniqueViews });
          }
        } catch (error) {
          console.error('Failed to fetch all stats:', error);
        }
      }
    }
    fetchAllStats();
  }, [address, connected]);

  useEffect(() => {
    async function fetchUserData() {
      if (address && connected) {
        try {
          // Create/update user in backend
          const userData = await upsertUser({ walletAddress: address });
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
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

  const refreshArticles = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, pagination.totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  // Calculate stats from all articles (not just current page)
  const totalViews = allStats.totalViews;
  const totalUniqueViews = allStats.totalUniqueViews;
  const totalLikes = allStats.totalLikes;

  return {
    connected,
    connecting,
    address,
    balance,
    copied,
    isChecking,
    articles,
    loading: isLoading,
    user,
    stats: {
      views: totalViews,
      uniqueViews: totalUniqueViews,
      likes: totalLikes,
      articles: allStats.published,
      drafts: allStats.drafts,
    },
    pagination: {
      currentPage,
      totalPages: pagination.totalPages,
      total: pagination.total,
      hasNext: currentPage < pagination.totalPages,
      hasPrev: currentPage > 1,
    },
    copyAddress,
    handleDisconnect,
    refreshArticles,
    goToPage,
    nextPage,
    prevPage,
  };
}
