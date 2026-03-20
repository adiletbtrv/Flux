import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchCurrencies, fetchRates } from './services/api';
import CurrencyRow from './components/CurrencyRow';
import RateChart from './components/RateChart';
import HistoryList, { HistoryItem } from './components/HistoryList';
import FluxLogo from './components/FluxLogo';
import { CurrencyOption, Rates } from './types';

const STORE = {
  theme: 'flux_theme',
  history: 'flux_history',
  from: 'flux_from',
  to: 'flux_to',
  amount: 'flux_amount',
};

function formatRate(rate: number): string {
  if (rate === 0) return '0';
  if (rate >= 100) return rate.toFixed(2);
  if (rate >= 1) return rate.toFixed(4);
  if (rate >= 0.01) return rate.toFixed(6);
  return rate.toPrecision(4);
}

function parseUtcDate(raw: string): string {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw.slice(0, 16);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return '';
  }
}

const PRIORITY = ['USD', 'EUR', 'RUB', 'KZT', 'KGS', 'GBP', 'CNY'];

function App() {
  const [fromCurrency, setFromCurrency] = useState<string>(
    () => localStorage.getItem(STORE.from) || 'USD',
  );
  const [toCurrency, setToCurrency] = useState<string>(
    () => localStorage.getItem(STORE.to) || 'EUR',
  );
  const [amount, setAmount] = useState<string>(
    () => localStorage.getItem(STORE.amount) || '',
  );
  const [amountInFrom, setAmountInFrom] = useState(true);

  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Rates>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'history'>('chart');
  const [copySuccess, setCopySuccess] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORE.history) || '[]'); }
    catch { return []; }
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORE.theme);
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem(STORE.theme, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => { localStorage.setItem(STORE.from, fromCurrency); }, [fromCurrency]);
  useEffect(() => { localStorage.setItem(STORE.to, toCurrency); }, [toCurrency]);
  useEffect(() => { localStorage.setItem(STORE.amount, amount); }, [amount]);

  useEffect(() => {
    localStorage.setItem(STORE.history, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const init = async () => {
      try {
        setIsInitialLoading(true);
        const data = await fetchCurrencies();
        const options = Object.entries(data)
          .map(([code, name]) => ({ code, name }))
          .sort((a, b) => {
            const ai = PRIORITY.indexOf(a.code);
            const bi = PRIORITY.indexOf(b.code);
            if (ai !== -1 && bi !== -1) return ai - bi;
            if (ai !== -1) return -1;
            if (bi !== -1) return 1;
            return a.code.localeCompare(b.code);
          });
        setCurrencyOptions(options);
        const ratesData = await fetchRates(fromCurrency);
        setExchangeRates(ratesData.rates);
        setLastUpdated(parseUtcDate(ratesData.date));
      } catch {
        setError('Service temporarily unavailable.');
      } finally {
        setIsInitialLoading(false);
      }
    };
    init();
  }, []);
  useEffect(() => {
    if (isInitialLoading) return;
    const update = async () => {
      try {
        setIsUpdatingRates(true);
        setError(null);
        const ratesData = await fetchRates(fromCurrency);
        setExchangeRates(ratesData.rates);
        setLastUpdated(parseUtcDate(ratesData.date));
      } catch {
      } finally {
        setIsUpdatingRates(false);
      }
    };
    update();
  }, [fromCurrency]);

  const { fromAmount, toAmount } = useMemo(() => {
    const rate = exchangeRates[toCurrency];
    const parsed = parseFloat(amount);
    const valid = amount !== '' && !isNaN(parsed);

    if (amountInFrom) {
      return {
        fromAmount: amount,
        toAmount: valid && rate !== undefined ? (parsed * rate).toFixed(2) : '',
      };
    } else {
      return {
        fromAmount: valid && rate ? (parsed / rate).toFixed(2) : '',
        toAmount: amount,
      };
    }
  }, [amount, amountInFrom, exchangeRates, toCurrency]);
  useEffect(() => {
    if (!fromAmount || !toAmount || fromAmount === '0' || toAmount === '0' || isInitialLoading) return;
    const t = setTimeout(() => {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        from: fromCurrency,
        to: toCurrency,
        amountFrom: parseFloat(fromAmount).toLocaleString(),
        amountTo: parseFloat(toAmount).toLocaleString(),
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory(prev => {
        const dup = prev[0];
        if (dup?.amountFrom === newItem.amountFrom && dup?.from === newItem.from && dup?.to === newItem.to) return prev;
        return [newItem, ...prev].slice(0, 10);
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [fromAmount, toAmount, fromCurrency, toCurrency, isInitialLoading]);

  const handleFromAmountChange = useCallback((v: string) => { setAmount(v); setAmountInFrom(true); }, []);
  const handleToAmountChange = useCallback((v: string) => { setAmount(v); setAmountInFrom(false); }, []);

  const handleSwap = useCallback(() => {
    setIsSwapping(true);
    setTimeout(() => {
      setFromCurrency(c => {
        return c;
      });
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
      setAmountInFrom(true);
      setTimeout(() => setIsSwapping(false), 80);
    }, 120);
  }, [fromCurrency, toCurrency]);

  const handleCopy = useCallback(() => {
    if (!toAmount) return;
    const text = toAmount.toString();

    const succeed = () => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(succeed).catch(() => {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        succeed();
      });
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      succeed();
    }
  }, [toAmount]);

  const handleRestoreHistory = useCallback((item: HistoryItem) => {
    setFromCurrency(item.from);
    setToCurrency(item.to);
    setAmount(item.amountFrom.replace(/,/g, ''));
    setAmountInFrom(true);
  }, []);

  const getCurrencyName = useCallback(
    (code: string) => currencyOptions.find(o => o.code === code)?.name || code,
    [currencyOptions],
  );

  const currentRate = exchangeRates[toCurrency];
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#F1F5F9] dark:bg-[#020617] font-sans transition-colors duration-300">
      <div className="w-full max-w-lg flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <FluxLogo size={40} />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white leading-none">Flux</h1>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                Global Exchange
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsDarkMode(d => !d)}
              className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className={`block w-2 h-2 rounded-full transition-colors ${isUpdatingRates ? 'bg-amber-400' : 'bg-emerald-500'}`} />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {isUpdatingRates ? 'Syncing…' : 'Live'}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/30 border border-slate-100 dark:border-slate-800 p-1 relative overflow-visible z-20 transition-colors duration-300">

          {error && (
            <div className="absolute -top-12 inset-x-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl text-sm font-medium border border-rose-100 dark:border-rose-900/30 text-center">
              {error}
            </div>
          )}

          {isInitialLoading ? (
            <div className="py-24 flex items-center justify-center">
              <div className="h-8 w-8 border-[3px] border-slate-100 dark:border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="p-5 sm:p-6 space-y-2">

              {/* From row */}
              <div className={`relative z-30 transition-opacity duration-150 ${isSwapping ? 'opacity-40' : 'opacity-100'}`}>
                <CurrencyRow
                  label="You Send"
                  amount={fromAmount}
                  currency={fromCurrency}
                  currencies={currencyOptions}
                  onAmountChange={handleFromAmountChange}
                  onCurrencyChange={setFromCurrency}
                />
                <div className="h-5 mt-1 px-1">
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate">
                    {getCurrencyName(fromCurrency)}
                  </p>
                </div>
              </div>
              <div className="relative h-4 flex items-center justify-center z-20">
                <div className="absolute inset-x-0 h-px bg-slate-100 dark:bg-slate-800" />
                <button
                  onClick={handleSwap}
                  aria-label="Swap currencies"
                  className="
                    relative
                    bg-white dark:bg-slate-800
                    hover:bg-indigo-50 dark:hover:bg-slate-700
                    text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400
                    p-2 rounded-full
                    border-4 border-[#F1F5F9] dark:border-[#020617]
                    shadow-sm
                    transition-colors duration-150
                  "
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                  </svg>
                </button>
              </div>

              {/* To row */}
              <div className={`relative z-10 transition-opacity duration-150 ${isSwapping ? 'opacity-40' : 'opacity-100'}`}>
                <CurrencyRow
                  label="You Receive"
                  amount={toAmount}
                  currency={toCurrency}
                  currencies={currencyOptions}
                  onAmountChange={handleToAmountChange}
                  onCurrencyChange={setToCurrency}
                  readOnly
                  loading={isUpdatingRates}
                />
                <div className="flex justify-between items-center mt-1 px-1 h-5">
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate max-w-[70%]">
                    {getCurrencyName(toCurrency)}
                  </p>
                  {toAmount && toAmount !== '0' && (
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                      {copySuccess ? (
                        '✓ Copied'
                      ) : (
                        <>
                          Copy
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Rate + last updated */}
              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4">
                {currentRate !== undefined ? (
                  <div className="flex items-baseline gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      1 {fromCurrency}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-xs">≈</span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {formatRate(currentRate)} {toCurrency}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                )}
                {lastUpdated && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                    {lastUpdated}
                  </span>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Chart/History card */}
        {!isInitialLoading && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg shadow-slate-200/40 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 p-4 sm:p-6 transition-colors duration-300">

            {/* Tab switcher */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5">
              {(['chart', 'history'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all duration-150
                    ${activeTab === tab
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }
                  `}
                >
                  {tab === 'chart' ? 'Market Trend' : 'History'}
                </button>
              ))}
            </div>

            <div className="min-h-[220px]">
              {activeTab === 'chart' && (
                <div className="animate-fade-in">
                  <RateChart from={fromCurrency} to={toCurrency} isDarkMode={isDarkMode} />
                </div>
              )}
              {activeTab === 'history' && (
                <div className="animate-fade-in">
                  <HistoryList
                    history={history}
                    onClear={() => setHistory([])}
                    onRestore={handleRestoreHistory}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500 pb-6">
          <div className="flex gap-3">
            <a
              href="https://github.com/adiletbtrv"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-105 transition-all"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/adilet-batyrov/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 transition-all"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
          <p className="text-[10px] font-medium opacity-40">© 2025 Flux Financial.</p>
        </div>

      </div>
    </div>
  );
}

export default App;