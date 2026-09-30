import { Search, X } from 'lucide-react';

interface SearchTriggerProps {
  onClick: () => void;
}

export function SearchTrigger({ onClick }: SearchTriggerProps) {
  return (
    <button
      onClick={onClick}
      className="group flex h-9 items-center gap-2 rounded-full border border-border
        px-3 text-[13px] text-muted-foreground
        hover:border-foreground/40 hover:text-foreground
        transition-colors duration-150 cursor-pointer"
      aria-label="Open search"
    >
      <Search className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="hidden sm:inline font-medium">Search</span>
      <kbd
        className="hidden sm:inline ml-1 rounded-full border border-border
        px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground leading-none"
      >
        ⌘K
      </kbd>
    </button>
  );
}

interface SearchOverlayProps {
  onClose: () => void;
}

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  return <div className="absolute inset-0 bg-background/90" onClick={onClose} aria-hidden="true" />;
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
    <div
      className="relative flex items-center rounded-full border border-border bg-card
      focus-within:border-brand-blue
      transition-colors duration-150"
    >
      <Search className="absolute left-4 h-5 w-5 text-muted-foreground flex-shrink-0 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        aria-label="Search articles"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search articles, topics, tags…"
        className="w-full bg-transparent py-4 pl-12 pr-12 text-[17px] text-foreground
          placeholder:text-muted-foreground outline-none leading-none"
      />
      <button
        type="button"
        onClick={handleCloseClick}
        onMouseDown={(e) => e.preventDefault()}
        className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-full
          text-muted-foreground hover:text-foreground hover:bg-muted
          transition-all duration-150"
        aria-label="Close search"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SearchHint() {
  return (
    <p className="mt-3 text-center text-[12px] text-muted-foreground">
      Press{' '}
      <kbd
        className="mx-0.5 rounded-full border border-border bg-card
        px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
      >
        ESC
      </kbd>{' '}
      to close
    </p>
  );
}
