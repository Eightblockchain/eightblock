'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserWallet } from '@meshsdk/core';
import { fetcher } from '@/lib/api';

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  wallet: BrowserWallet | null;
  connect: (walletName?: string) => Promise<void>;
  disconnect: () => void;
  availableWallets: Array<{ name: string; icon: string; version: string }>;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  connecting: false,
  address: null,
  wallet: null,
  connect: async () => {},
  disconnect: () => {},
  availableWallets: [],
});

const getCardanoWalletApi = (walletName?: string) => {
  if (typeof window === 'undefined' || !walletName) return undefined;
  return (window as any).cardano?.[walletName.toLowerCase()];
};

async function isWalletExtensionEnabled(walletName: string) {
  try {
    const cardanoWallet = getCardanoWalletApi(walletName);
    if (cardanoWallet?.isEnabled) {
      return await cardanoWallet.isEnabled();
    }
  } catch (error) {
    console.warn('isEnabled check failed:', error);
  }
  return false;
}

function clearWalletStorage() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('walletConnected');
  localStorage.removeItem('walletName');
  localStorage.removeItem('userId');
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [wallet, setWallet] = useState<BrowserWallet | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [availableWallets, setAvailableWallets] = useState<
    Array<{ name: string; icon: string; version: string }>
  >([]);

  // Get available wallets on mount
  useEffect(() => {
    const wallets = BrowserWallet.getInstalledWallets();
    setAvailableWallets(wallets);
  }, []);

  const hydrateWalletSession = useCallback(async (walletName: string) => {
    const browserWallet = await BrowserWallet.enable(walletName);
    const walletAddress = (await browserWallet.getChangeAddress()).toLowerCase();
    setWallet(browserWallet);
    setAddress(walletAddress);
    setConnected(true);
    return { browserWallet, walletAddress };
  }, []);

  const connect = useCallback(
    async (walletName?: string) => {
      setConnecting(true);
      try {
        // Get list of available wallets
        const installedWallets = BrowserWallet.getInstalledWallets();

        if (installedWallets.length === 0) {
          alert('No Cardano wallet found. Please install a wallet extension (Nami, Eternl, etc.)');
          setConnecting(false);
          return;
        }

        // Connect to the first available wallet
        const selectedWalletName = walletName ?? installedWallets[0].name;
        const cardanoWallet = getCardanoWalletApi(selectedWalletName);
        if (!cardanoWallet) {
          throw new Error('Wallet API not available');
        }

        const { browserWallet, walletAddress } = await hydrateWalletSession(selectedWalletName);

        // Secure authentication with CIP-30 direct API
        try {
          // Step 1: Request nonce from backend
          const { nonce } = await fetcher('/auth/wallet/nonce', {
            method: 'POST',
            body: JSON.stringify({ walletAddress }),
          });

          // Step 2: Sign nonce using raw CIP-30 API (not MeshSDK's broken signData)
          // Access the wallet's CIP-30 API directly
          const api = await cardanoWallet.enable();

          // CIP-30 signData requires the hex-encoded wallet address
          const signingAddress = await api.getChangeAddress();

          // Sign the backend-provided nonce (already hex) directly
          const signedData = await api.signData(signingAddress, nonce);

          // Step 3: Send signature to backend for verification
          const data = await fetcher('/auth/wallet', {
            method: 'POST',
            body: JSON.stringify({
              walletAddress,
              nonce,
              signature: signedData.signature,
              key: signedData.key,
            }),
          });

          // Store only user ID (token is in httpOnly cookie)
          localStorage.setItem('userId', data.user.id);

          console.log('Wallet authenticated successfully:', data.user);
        } catch (authError) {
          console.error('Failed to authenticate with backend:', authError);
          alert(
            `Authentication failed: ${authError instanceof Error ? authError.message : 'Unknown error'}`
          );
          throw authError;
        }

        setWallet(browserWallet);
        setAddress(walletAddress);
        setConnected(true);
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletName', selectedWalletName);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setConnected(false);
        setAddress(null);
        setWallet(null);
        clearWalletStorage();
      } finally {
        setConnecting(false);
      }
    },
    [hydrateWalletSession]
  );

  const disconnect = useCallback(async () => {
    clearWalletStorage();
    try {
      // Call backend logout to revoke token
      await fetcher('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if logout fails
    }

    setWallet(null);
    setAddress(null);
    setConnected(false);
  }, []);

  // Auto-reconnect on mount if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected');
    if (wasConnected === 'true') {
      let cancelled = false;
      const attemptReconnect = async () => {
        if (wasConnected !== 'true') {
          setInitializing(false);
          return;
        }

        const storedWalletName = localStorage.getItem('walletName');
        if (!storedWalletName) {
          setInitializing(false);
          return;
        }

        const stillEnabled = await isWalletExtensionEnabled(storedWalletName);
        if (stillEnabled) {
          try {
            setConnecting(true);
            await hydrateWalletSession(storedWalletName);
          } catch (error) {
            console.error('Failed to resume wallet session:', error);
          } finally {
            if (!cancelled) {
              setConnecting(false);
              setInitializing(false);
            }
          }
          return;
        }

        await connect(storedWalletName);
        if (!cancelled) {
          setInitializing(false);
        }
      };

      attemptReconnect();

      return () => {
        cancelled = true;
      };
    } else {
      setInitializing(false);
    }
  }, [connect, hydrateWalletSession]);

  // Mark initialization complete after connection attempt
  useEffect(() => {
    if (!connecting && initializing) {
      setInitializing(false);
    }
  }, [connecting, initializing]);

  return (
    <WalletContext.Provider
      value={{
        connected,
        connecting: connecting || initializing,
        address,
        wallet,
        connect,
        disconnect,
        availableWallets,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
