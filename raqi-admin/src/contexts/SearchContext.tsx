import { createContext, useContext, type ReactNode } from 'react';

type SearchContextValue = {
  query: string;
  setQuery: (value: string) => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({
  query,
  setQuery,
  children,
}: SearchContextValue & { children: ReactNode }) {
  return (
    <SearchContext.Provider value={{ query, setQuery }}>{children}</SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    return { query: '', setQuery: () => undefined };
  }
  return context;
}

export function filterRows<T extends Record<string, unknown>>(
  rows: T[],
  query: string,
  keys?: string[],
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return rows;
  }
  return rows.filter((row) => {
    const values = keys?.length
      ? keys.map((key) => row[key])
      : Object.values(row);
    return values.some((value) => String(value ?? '').toLowerCase().includes(normalized));
  });
}
