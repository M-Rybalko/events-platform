import { useEffect, useRef, useState } from 'react';
import { searchAddress, type GeocodingResult } from '@/lib/geocoding';

interface Props {
  onPick: (result: GeocodingResult) => void;
}

export function AddressSearch({ onPick }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Дебаунс: чекаємо 400мс після останнього вводу
  useEffect(() => {
    if (!query.trim() || query.trim().length < 3) {
      setResults([]);
      return;
    }

    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      try {
        const data = await searchAddress(query, controller.signal);
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [query]);

  // Закривати дропдаун при кліку поза
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handlePick = (result: GeocodingResult) => {
    onPick(result);
    setQuery(result.displayName);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Шукати за адресою (мінімум 3 символи)…"
          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
        />
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          width="16" height="16" viewBox="0 0 24 24" fill="none"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {isLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            …
          </span>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute z-[500] mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((r, idx) => (
            <li key={`${r.latitude}-${r.longitude}-${idx}`}>
              <button
                type="button"
                onClick={() => handlePick(r)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <p className="text-slate-900 line-clamp-1">{r.displayName.split(',')[0]}</p>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{r.displayName}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && !isLoading && query.length >= 3 && results.length === 0 && (
        <div className="absolute z-[500] mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
          Нічого не знайдено
        </div>
      )}
    </div>
  );
}
