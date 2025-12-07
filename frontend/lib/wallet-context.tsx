'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserWallet } from '@meshsdk/core';

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

  const connect = useCallback(async (walletName?: string) => {
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
      const walletName = installedWallets[0].name;
      const browserWallet = await BrowserWallet.enable(walletName);
      const walletAddress = await browserWallet.getChangeAddress();

      setWallet(browserWallet);
      setAddress(walletAddress);
      setConnected(true);
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletName', walletName);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setConnected(false);
      setAddress(null);
      setWallet(null);
      // Clear localStorage on connection failure
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletName');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    setAddress(null);
    setConnected(false);
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletName');
  }, []);

  // Auto-reconnect on mount if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected');
    if (wasConnected === 'true') {
      connect();
    } else {
      setInitializing(false);
    }
  }, [connect]);

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
