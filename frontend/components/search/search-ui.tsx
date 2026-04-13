import { Search, X } from 'lucide-react';

interface SearchTriggerProps {
  onClick: () => void;
}

export function SearchTrigger({ onClick }: SearchTriggerProps) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 rounded-xl border border-border/50 bg-card/40
        px-3 py-1.5 text-[13px] text-muted-foreground/60
        hover:border-border hover:bg-card hover:text-foreground/80
        transition-all duration-150 cursor-pointer"
      aria-label="Open search"
    >
      <Search className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="hidden sm:inline font-medium">Search</span>
      <kbd className="hidden sm:inline ml-1 rounded-md border border-border/60 bg-background/60
        px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/40 leading-none">
        ⌘K
      </kbd>
    </button>
  );
}

interface SearchOverlayProps {
  onClose: () => void;
}

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  return (
    <div
      className="absolute inset-0 bg-background/75 backdrop-blur-md"
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
    <div className="relative flex items-center rounded-2xl border border-border bg-card
      shadow-2xl shadow-black/50
      focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/12
      transition-all duration-150">
      <Search className="absolute left-4 h-5 w-5 text-muted-foreground/50 flex-shrink-0 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search articles, topics, tags…"
        className="w-full bg-transparent py-4 pl-12 pr-12 text-[17px] text-foreground
          placeholder:text-muted-foreground/35 outline-none leading-none"
      />
      <button
        type="button"
        onClick={handleCloseClick}
        onMouseDown={(e) => e.preventDefault()}
        className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-lg
          text-muted-foreground/40 hover:text-foreground/70 hover:bg-card/80
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
    <p className="mt-3 text-center text-[12px] text-muted-foreground/35">
      Press{' '}
      <kbd className="mx-0.5 rounded-md border border-border/50 bg-card
        px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/50">
        ESC
      </kbd>{' '}
      to close
    </p>
  );
}

