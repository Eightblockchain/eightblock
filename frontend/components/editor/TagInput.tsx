'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Plus, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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

  // Parse selected tags from comma-separated value
  const selectedTags = value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  // Fetch all tags using React Query
  const { data: allTags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!inputValue.trim()) return [];

    return allTags.filter((tag) => {
      const tagName = tag.name.toLowerCase();
      const input = inputValue.toLowerCase();
      return tagName.includes(input) && !selectedTags.includes(tag.name);
    });
  }, [inputValue, allTags, selectedTags]);

  // Click outside handler
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

    const newTags = [...selectedTags, trimmedTag];
    onChange(newTags.join(', '));
    setInputValue('');
    setShowSuggestions(false);

    // Note: New tags will be created when the article is submitted
  };

  const removeTag = (tagName: string) => {
    const newTags = selectedTags.filter((tag) => tag !== tagName);
    onChange(newTags.join(', '));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="tags-input">Tags</Label>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="pl-3 pr-1 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20"
            >
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-1 ml-1 hover:bg-transparent"
                onClick={() => removeTag(tag)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <Input
          ref={inputRef}
          id="tags-input"
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedTags.length === 0
              ? 'Start typing to see suggestions... (e.g., cardano, blockchain, web3)'
              : 'Add more tags...'
          }
          className="w-full"
          disabled={isLoading}
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && (inputValue || suggestions.length > 0 || allTags.length > 0) && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-[2px] shadow-lg max-h-64 overflow-y-auto"
          >
            {/* Show filtered suggestions if there's input */}
            {inputValue && suggestions.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                  Suggested Tags
                </div>
                {suggestions.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
                    onClick={() => addTag(tag.name)}
                  >
                    <span className="text-sm text-gray-700">{tag.name}</span>
                    <Check className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </>
            )}

            {/* Option to create new tag */}
            {inputValue &&
              !allTags.find((t) => t.name.toLowerCase() === inputValue.toLowerCase()) && (
                <>
                  {suggestions.length > 0 && <div className="border-t" />}
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-primary/5 flex items-center gap-2 text-primary font-medium"
                    onClick={() => addTag(inputValue)}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">Create &quot;{inputValue}&quot;</span>
                  </button>
                </>
              )}

            {/* Show all tags when no input */}
            {!inputValue && allTags.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                  All Available Tags
                </div>
                {allTags
                  .filter((tag) => !selectedTags.includes(tag.name))
                  .slice(0, 20)
                  .map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
                      onClick={() => addTag(tag.name)}
                    >
                      <span className="text-sm text-gray-700">{tag.name}</span>
                      <Check className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
              </>
            )}

            {/* Empty state */}
            {!inputValue && allTags.length === 0 && !isLoading && (
              <div className="px-3 py-6 text-center text-sm text-gray-500">
                No tags yet. Start typing to create one!
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="px-3 py-6 text-center text-sm text-gray-500">Loading tags...</div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Select from existing tags or type to create new ones. Press Enter or comma to add.
      </p>
    </div>
  );
}
