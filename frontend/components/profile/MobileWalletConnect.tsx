'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Wallet, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface MobileWalletConnectProps {
  onClose?: () => void;
}

// Popular Cardano mobile wallets with deep linking support
const MOBILE_WALLETS = [
  {
    name: 'Vespr',
    icon: '🦊',
    deepLink: 'vespr://',
    storeUrl: {
      ios: 'https://apps.apple.com/app/vespr-wallet/id1565896683',
      android: 'https://play.google.com/store/apps/details?id=io.vespr.wallet',
    },
    wcSupport: false,
  },
  {
    name: 'Eternl',
    icon: '♾️',
    deepLink: 'eternl://',
    storeUrl: {
      ios: 'https://apps.apple.com/app/eternl/id6444927989',
      android: 'https://play.google.com/store/apps/details?id=io.ccvault.app',
    },
    wcSupport: false,
  },
  {
    name: 'Nufi',
    icon: '🔷',
    deepLink: 'nufi://',
    storeUrl: {
      ios: 'https://apps.apple.com/app/nufi/id1590677312',
      android: 'https://play.google.com/store/apps/details?id=com.nufi.mobile',
    },
    wcSupport: false,
  },
  {
    name: 'Yoroi',
    icon: '🦅',
    deepLink: 'yoroi://',
    storeUrl: {
      ios: 'https://apps.apple.com/app/emurgos-yoroi-cardano-wallet/id1447326389',
      android: 'https://play.google.com/store/apps/details?id=com.emurgo',
    },
    wcSupport: false,
  },
];

export function MobileWalletConnect({ onClose }: MobileWalletConnectProps) {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'unknown'>('unknown');

  useEffect(() => {
    // Detect mobile platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    }
  }, []);

  const handleWalletDeepLink = (wallet: (typeof MOBILE_WALLETS)[0]) => {
    // Try to open the wallet app
    window.location.href = wallet.deepLink;

    // Fallback to app store if wallet doesn't open within 2 seconds
    setTimeout(() => {
      if (document.hidden) return; // User navigated to the app

      // Redirect to appropriate store
      if (platform === 'ios') {
        window.location.href = wallet.storeUrl.ios;
      } else if (platform === 'android') {
        window.location.href = wallet.storeUrl.android;
      }
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 mb-2">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Connect Mobile Wallet</h3>
        <p className="text-sm text-muted-foreground">Use your mobile Cardano wallet to connect</p>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-900">Mobile Wallet Limitation</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Mobile wallets on phones are app-based and cannot directly connect to websites like
            desktop browser extensions. You'll need to use the in-app browser within your wallet
            app.
          </p>
        </div>
      </div>

      {/* Solution Steps */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">How to Connect:</h4>

        <div className="space-y-3">
          {/* Step 1 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              1
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Open Your Wallet App</p>
              <p className="text-xs text-muted-foreground mt-1">
                Launch your Cardano mobile wallet app
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Use In-App Browser</p>
              <p className="text-xs text-muted-foreground mt-1">
                Find the built-in browser or DApp browser feature
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              3
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Navigate to EightBlock</p>
              <p className="text-xs text-muted-foreground mt-1">
                Visit <span className="font-mono text-primary">eightblock.io</span> from within the
                wallet
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              4
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Connect Wallet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "Connect Wallet" - it will automatically detect your wallet
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Apps */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Recommended Mobile Wallets:</h4>

        <div className="grid gap-2">
          {MOBILE_WALLETS.map((wallet) => (
            <div
              key={wallet.name}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{wallet.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{wallet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {wallet.wcSupport ? 'DApp browser ready' : 'Has in-app browser'}
                  </p>
                </div>
              </div>

              {platform !== 'unknown' && (
                <Link
                  href={platform === 'ios' ? wallet.storeUrl.ios : wallet.storeUrl.android}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Install
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alternative: Desktop Browser */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">Easier Alternative</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              For the best experience, use EightBlock on a desktop/laptop browser with a wallet
              extension like Nami, Eternl, or Yoroi installed. Desktop wallet extensions connect
              directly to websites.
            </p>
          </div>
        </div>
      </div>

      {/* Close Button */}
      {onClose && (
        <Button onClick={onClose} variant="outline" className="w-full">
          Got it, thanks!
        </Button>
      )}
    </div>
  );
}
