import { User } from 'lucide-react';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const fullSrc = src?.startsWith('http')
    ? src
    : src
      ? `${API_URL.replace('/api', '')}${src}`
      : null;
  const initial = (name || 'A')[0].toUpperCase();

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {fullSrc ? (
        <div className="relative h-full w-full">
          <Image
            src={fullSrc}
            alt={name || 'User avatar'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 40px, 48px"
          />
        </div>
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary via-secondary/20 to-primary-700 text-white font-semibold">
          {name ? initial : <User className={iconSizes[size]} />}
        </div>
      )}
    </div>
  );
}
