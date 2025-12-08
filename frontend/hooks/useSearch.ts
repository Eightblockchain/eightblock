import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface UseSearchReturn {
  isOpen: boolean;
  query: string;
  inputRef: React.RefObject<HTMLInputElement>;
  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (query: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export function useSearch(): UseSearchReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const openSearch = useCallback(() => setIsOpen(true), []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        // Navigate to homepage with search query
        router.push(`/?search=${encodeURIComponent(query.trim())}`);
        closeSearch();
      }
    },
    [query, router, closeSearch]
  );

  // Auto-focus input when search opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle ESC key to close search
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeSearch();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeSearch]);

  return {
    isOpen,
    query,
    inputRef,
    openSearch,
    closeSearch,
    setQuery,
    handleSubmit,
  };
}
