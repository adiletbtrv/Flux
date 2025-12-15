import React, { useState, useRef, useEffect } from 'react';
import { CurrencyOption } from '../types';

interface CurrencySelectProps {
  value: string;
  options: CurrencyOption[];
  onChange: (value: string) => void;
  getFlagUrl: (code: string) => string;
}

const CurrencySelect: React.FC<CurrencySelectProps> = ({ value, options, onChange, getFlagUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    opt => 
      opt.code.toLowerCase().includes(search.toLowerCase()) || 
      opt.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-2 pr-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
      >
        <img 
          src={getFlagUrl(value)} 
          alt={value}
          className="h-5 w-7 sm:h-6 sm:w-8 rounded-[3px] shadow-sm object-cover border border-slate-200 dark:border-slate-700"
        />
        <span className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{value}</span>
        <svg 
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={2.5} 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 max-h-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden flex flex-col animate-fade-in">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-600">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => {
                    onChange(opt.code);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    value === opt.code 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <img 
                    src={getFlagUrl(opt.code)} 
                    alt="" 
                    className="h-4 w-6 rounded-[2px] object-cover opacity-80"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{opt.code}</span>
                    <span className="text-[10px] opacity-70 truncate max-w-[140px]">{opt.name}</span>
                  </div>
                  {value === opt.code && (
                    <svg className="ml-auto h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                Not found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelect;