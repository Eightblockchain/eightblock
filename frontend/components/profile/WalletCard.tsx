import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, Copy, Check } from 'lucide-react';

interface WalletCardProps {
  address: string;
  balance: string | null;
  copied: boolean;
  onCopyAddress: () => void;
}

export function WalletCard({ address, balance, copied, onCopyAddress }: WalletCardProps) {
  return (
    <Card className="p-4 border-2 border-[#080808]">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-full">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Wallet Address</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-foreground">
                {address?.slice(0, 12)}...{address?.slice(-8)}
              </code>
              <Button
                onClick={onCopyAddress}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3 text-primary" />
                )}
              </Button>
            </div>
          </div>
        </div>
        {balance && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Balance</p>
            <p className="text-xl font-bold text-foreground">{balance} ADA</p>
          </div>
        )}
        <div className="text-right">
          <p className="text-xs text-gray-500">Network</p>
          <p className="text-sm font-medium text-foreground">Cardano Mainnet</p>
        </div>
      </div>
    </Card>
  );
}
