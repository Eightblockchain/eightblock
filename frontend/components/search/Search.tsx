'use client';

import { useSearch } from '@/hooks/useSearch';
import { SearchTrigger, SearchOverlay, SearchInput, SearchHint } from './search-ui';

export default function SearchComponent() {
  const { isOpen, query, inputRef, openSearch, closeSearch, setQuery, handleSubmit } = useSearch();

  return (
    <>
      <SearchTrigger onClick={openSearch} />

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20">
          <SearchOverlay onClose={closeSearch} />

          <div className="relative z-[10000] w-full max-w-2xl mx-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleSubmit} className="relative">
              <SearchInput
                value={query}
                onChange={setQuery}
                onClose={closeSearch}
                inputRef={inputRef}
              />
            </form>
            <SearchHint />
          </div>
        </div>
      )}
    </>
  );
}
