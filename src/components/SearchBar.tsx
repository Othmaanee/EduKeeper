
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from './ui/input';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  value?: string;
}

export function SearchBar({ onSearch, value }: SearchBarProps = {}) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState(value || '');
  
  // Sync with external value if provided
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    if (onSearch) {
      onSearch(newQuery);
    }
  };

  return (
    <div className={`
      relative flex items-center w-full max-w-md transition-all duration-300
      ${focused ? 'bg-white shadow-subtle' : 'bg-secondary'}
      rounded-lg px-3 py-1.5
    `}>
      <Search className="h-4 w-4 text-muted-foreground mr-2" />
      <Input 
        type="search"
        placeholder="Rechercher des documents..."
        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-8 text-sm"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        value={query}
        onChange={handleSearch}
      />
    </div>
  );
}
