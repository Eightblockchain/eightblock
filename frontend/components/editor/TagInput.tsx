'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Plus, Check } from 'lucide-react';
import { fetchTags } from '@/lib/services/tag-service';

interface TagInputProps {
  value: string; // comma-separated string
  onChange: (value: string) => void;
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const selectedTags = value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  const { data: allTags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const suggestions = useMemo(() => {
    if (!inputValue.trim()) return [];
    return allTags.filter((tag) => {
      const tagName = tag.name.toLowerCase();
      const input = inputValue.toLowerCase();
      return tagName.includes(input) && !selectedTags.includes(tag.name);
    });
  }, [inputValue, allTags, selectedTags]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim();
    if (!trimmedTag || selectedTags.includes(trimmedTag)) return;
    onChange([...selectedTags, trimmedTag].join(', '));
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagName: string) => {
    onChange(selectedTags.filter((tag) => tag !== tagName).join(', '));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  return (
    <div className="space-y-3">

      {/* Selected pills */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-accent/30
                bg-accent/10 px-2.5 py-0.5 text-[12px] font-semibold text-accent/80"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="flex h-3.5 w-3.5 items-center justify-center rounded-full
                  hover:bg-accent/20 text-accent/60 hover:text-accent transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? 'cardano, web3, defi…' : 'Add more…'}
          disabled={isLoading}
          className="w-full bg-transparent text-[13px] text-foreground
            placeholder:text-muted-foreground/30
            focus:outline-none border-none p-0"
        />

        {/* Dropdown */}
        {showSuggestions && (inputValue || allTags.length > 0) && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 z-50 w-full mt-2
              rounded-2xl border border-border/60 dark:border-border/30
              bg-card shadow-xl shadow-black/10 dark:shadow-black/40
              max-h-56 overflow-y-auto"
          >
            {inputValue && suggestions.length > 0 && (
              <>
                <div className="font-mono text-[9px] tracking-[0.18em] uppercase
                  text-muted-foreground/40 px-4 py-2.5 border-b border-border/40 dark:border-border/20">
                  Suggestions
                </div>
                {suggestions.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => addTag(tag.name)}
                    className="group w-full flex items-center justify-between
                      px-4 py-2.5 text-[13px] text-foreground/70 hover:text-foreground
                      hover:bg-muted/40 dark:hover:bg-muted/20
                      transition-colors duration-100 first-of-type:mt-0"
                  >
                    {tag.name}
                    <Check className="h-3.5 w-3.5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </>
            )}

            {inputValue && !allTags.find((t) => t.name.toLowerCase() === inputValue.toLowerCase()) && (
              <>
                {suggestions.length > 0 && <div className="border-t border-border/40 dark:border-border/20" />}
                <button
                  type="button"
                  onClick={() => addTag(inputValue)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5
                    text-[13px] font-semibold text-primary/70 hover:text-primary
                    hover:bg-primary/5 transition-colors duration-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create &quot;{inputValue}&quot;
                </button>
              </>
            )}

            {!inputValue && allTags.length > 0 && (
              <>
                <div className="font-mono text-[9px] tracking-[0.18em] uppercase
                  text-muted-foreground/40 px-4 py-2.5 border-b border-border/40 dark:border-border/20">
                  All Tags
                </div>
                {allTags
                  .filter((tag) => !selectedTags.includes(tag.name))
                  .slice(0, 20)
                  .map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => addTag(tag.name)}
                      className="group w-full flex items-center justify-between
                        px-4 py-2.5 text-[13px] text-foreground/70 hover:text-foreground
                        hover:bg-muted/40 dark:hover:bg-muted/20 transition-colors duration-100"
                    >
                      {tag.name}
                      <Check className="h-3.5 w-3.5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
              </>
            )}

            {!inputValue && allTags.length === 0 && !isLoading && (
              <div className="px-4 py-6 text-center font-mono text-[10px] text-muted-foreground/40">
                No tags yet. Type to create one.
              </div>
            )}

            {isLoading && (
              <div className="px-4 py-6 text-center font-mono text-[10px] text-muted-foreground/40">
                Loading…
              </div>
            )}
          </div>
        )}
      </div>

      <p className="font-mono text-[10px] text-muted-foreground/35">
        Enter or comma to add · Backspace to remove last
      </p>
    </div>
  );
}
