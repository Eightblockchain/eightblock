import { Search, X } from 'lucide-react';

interface SearchTriggerProps {
  onClick: () => void;
}

export function SearchTrigger({ onClick }: SearchTriggerProps) {
  return (
    <button
      onClick={onClick}
      className="text-muted-foreground hover:text-[#080808] transition-colors cursor-pointer"
      aria-label="Open search"
    >
      <Search className="w-5 h-5" />
    </button>
  );
}

interface SearchOverlayProps {
  onClose: () => void;
}

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  return (
    <div
      className="absolute inset-0 bg-white/80 backdrop-blur-md"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function SearchInput({ value, onChange, onClose, inputRef }: SearchInputProps) {
  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div className="relative flex items-center bg-white border-2 border-[#080808] rounded-lg shadow-2xl">
      <Search className="absolute left-4 w-5 h-5 text-[#080808]" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search articles, topics, tags..."
        className="w-full py-4 pl-12 pr-12 text-[#080808] placeholder-gray-400 bg-transparent outline-none text-lg"
      />
      <button
        type="button"
        onClick={handleCloseClick}
        onMouseDown={(e) => e.preventDefault()}
        className="absolute right-4 text-[#080808] hover:bg-gray-100 rounded-full p-1 transition-colors"
        aria-label="Close search"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export function SearchHint() {
  return (
    <p className="mt-3 text-sm text-[#080808]/60 text-center">
      Press{' '}
      <kbd className="px-2 py-1 bg-white border border-[#080808]/20 rounded text-xs font-mono">
        ESC
      </kbd>{' '}
      to close
    </p>
  );
}
