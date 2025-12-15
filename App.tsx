import React, { useState, useEffect, useCallback } from 'react';
import { fetchCurrencies, fetchRates } from './services/api';
import CurrencyRow from './components/CurrencyRow';
import RateChart from './components/RateChart';
import HistoryList, { HistoryItem } from './components/HistoryList';
import { CurrencyOption, Rates } from './types';

function App() {
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([]);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('KZT'); 
  const [exchangeRates, setExchangeRates] = useState<Rates>({});
  const [amount, setAmount] = useState<string>('100');
  const [amountInFromCurrency, setAmountInFromCurrency] = useState<boolean>(true);
  
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isUpdatingRates, setIsUpdatingRates] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'chart' | 'history'>('chart');
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('flux_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [copySuccess, setCopySuccess] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('flux_theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('flux_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('flux_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const init = async () => {
      try {
        setIsInitialLoading(true);
        const data = await fetchCurrencies();
        
        const priorityCodes = ['USD', 'EUR', 'RUB', 'KZT', 'KGS', 'GBP', 'CNY'];
        const options = Object.entries(data).map(([code, name]) => ({
          code,
          name,
        })).sort((a, b) => {
          const aPrio = priorityCodes.indexOf(a.code);
          const bPrio = priorityCodes.indexOf(b.code);
          if (aPrio !== -1 && bPrio !== -1) return aPrio - bPrio;
          if (aPrio !== -1) return -1;
          if (bPrio !== -1) return 1;
          return a.code.localeCompare(b.code);
        });

        setCurrencyOptions(options);
        const ratesData = await fetchRates(fromCurrency);
        setExchangeRates(ratesData.rates);
        setLastUpdated(ratesData.date);
      } catch (err) {
        setError("Service temporarily unavailable.");
      } finally {
        setIsInitialLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!fromCurrency || isInitialLoading) return;
    const updateRates = async () => {
      try {
        setIsUpdatingRates(true);
        setError(null);
        const ratesData = await fetchRates(fromCurrency);
        setExchangeRates(ratesData.rates);
        setLastUpdated(ratesData.date);
      } catch (err) {
        console.warn("Failed to update rates background");
      } finally {
        setIsUpdatingRates(false);
      }
    };
    updateRates();
  }, [fromCurrency]);

  useEffect(() => {
    localStorage.setItem('flux_history', JSON.stringify(history));
  }, [history]);

  const handleFromAmountChange = useCallback((value: string) => {
    setAmount(value);
    setAmountInFromCurrency(true);
  }, []);

  const handleToAmountChange = useCallback((value: string) => {
    setAmount(value);
    setAmountInFromCurrency(false);
  }, []);

  const handleSwap = useCallback(() => {
    setIsSwapping(true);
    setTimeout(() => {
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
      setAmountInFromCurrency(true);
      setTimeout(() => setIsSwapping(false), 50);
    }, 150);
  }, [fromCurrency, toCurrency]);

  let toAmount: number | string = '';
  let fromAmount: number | string = '';
  const currentRate = exchangeRates[toCurrency];

  if (amountInFromCurrency) {
    fromAmount = amount;
    if (currentRate !== undefined && amount !== '') {
        const parsed = parseFloat(amount);
        const res = (parsed * currentRate).toFixed(2);
        toAmount = isNaN(parsed) ? '' : res;
    }
  } else {
    toAmount = amount;
    if (currentRate !== undefined && amount !== '') {
        const parsed = parseFloat(amount);
        const res = (currentRate === 0 || isNaN(parsed)) ? '' : (parsed / currentRate).toFixed(2);
        fromAmount = res;
    }
  }

  useEffect(() => {
    if (!amount || amount === '0' || !toAmount || toAmount === '0' || isInitialLoading) return;
    
    const timeoutId = setTimeout(() => {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        from: fromCurrency,
        to: toCurrency,
        amountFrom: parseFloat(fromAmount.toString()).toLocaleString(),
        amountTo: parseFloat(toAmount.toString()).toLocaleString(),
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setHistory(prev => {
        if (prev.length > 0 && prev[0].amountFrom === newItem.amountFrom && prev[0].from === newItem.from && prev[0].to === newItem.to) {
          return prev;
        }
        return [newItem, ...prev].slice(0, 10);
      });
    }, 2000); 

    return () => clearTimeout(timeoutId);
  }, [amount, fromCurrency, toCurrency, toAmount, fromAmount]);

  const handleRestoreHistory = (item: HistoryItem) => {
    setFromCurrency(item.from);
    setToCurrency(item.to);
    setAmount(item.amountFrom.replace(/,/g, ''));
    setAmountInFromCurrency(true);
  };

  const handleCopy = () => {
    if (toAmount) {
      navigator.clipboard.writeText(toAmount.toString());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const getCurrencyName = (code: string) => {
    return currencyOptions.find(opt => opt.code === code)?.name || code;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#F1F5F9] dark:bg-[#020617] font-sans transition-colors duration-300">
      <div className="w-full max-w-lg flex flex-col gap-4">
        
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-600/20">
               ⚡
             </div>
             <div>
               <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Flux</h1>
               <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Global Exchange</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsDarkMode(!isDarkMode)}
               className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors"
               aria-label="Toggle Dark Mode"
             >
               {isDarkMode ? (
                 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                 </svg>
               ) : (
                 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                 </svg>
               )}
             </button>
             <div className={`
               flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm
             `}>
               <span className={`block w-2 h-2 rounded-full ${isUpdatingRates ? 'bg-amber-400' : 'bg-emerald-500'}`}></span>
               <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                 {isUpdatingRates ? 'Syncing...' : 'Live'}
               </span>
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 p-1 relative overflow-visible z-20 transition-colors duration-300">
          
          {error && (
            <div className="absolute -top-12 left-0 right-0 mx-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-lg text-sm font-medium border border-rose-100 dark:border-rose-900/30 text-center">
              {error}
            </div>
          )}

          {isInitialLoading ? (
             <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <div className="h-10 w-10 border-4 border-slate-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin"></div>
             </div>
          ) : (
            <div className="p-5 sm:p-6 space-y-2">
              
              <div className={`relative z-30 transition-all duration-200 ease-in-out ${isSwapping ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'}`}>
                <CurrencyRow
                  label="You Send"
                  amount={fromAmount}
                  currency={fromCurrency}
                  currencies={currencyOptions}
                  onAmountChange={handleFromAmountChange}
                  onCurrencyChange={setFromCurrency}
                />
                <div className="h-5 mt-1 px-1">
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate">{getCurrencyName(fromCurrency)}</p>
                </div>
              </div>

              <div className="relative h-4 flex items-center justify-center z-20">
                 <div className="absolute w-full h-px bg-slate-100 dark:bg-slate-800 top-1/2 -translate-y-1/2"></div>
                 <button 
                    onClick={handleSwap}
                    className="relative bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 p-2 rounded-full border-4 border-white dark:border-slate-900 transition-all duration-300 hover:rotate-180 hover:scale-110 shadow-sm"
                 >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                    </svg>
                 </button>
              </div>

              <div className={`relative z-10 transition-all duration-200 ease-in-out ${isSwapping ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'}`}>
                <CurrencyRow
                  label="You Receive"
                  amount={toAmount}
                  currency={toCurrency}
                  currencies={currencyOptions}
                  onAmountChange={handleToAmountChange}
                  onCurrencyChange={setToCurrency}
                  readOnly={true}
                  loading={isUpdatingRates}
                />
                 <div className="flex justify-between items-start mt-1 px-1 h-5">
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate max-w-[70%]">{getCurrencyName(toCurrency)}</p>
                    {toAmount && toAmount !== '0' && (
                      <button 
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                      >
                         {copySuccess ? 'Copied!' : 'Copy'}
                         {!copySuccess && (
                           <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                           </svg>
                         )}
                      </button>
                    )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  {currentRate ? (
                    <div className="flex items-baseline gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">1 {fromCurrency}</span>
                        <span className="text-slate-400 dark:text-slate-500 text-xs">≈</span>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{currentRate} {toCurrency}</span>
                    </div>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600 text-sm">---</span>
                  )}
                  {lastUpdated && (
                     <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{lastUpdated.split(' ')[4]} UTC</span>
                  )}
              </div>
            </div>
          )}
        </div>

        {!isInitialLoading && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 sm:p-6 transition-all duration-500 ease-out">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
              <button 
                onClick={() => setActiveTab('chart')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all duration-200 ${activeTab === 'chart' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                Market Trend
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all duration-200 ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                History
              </button>
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
        
        <div className="mt-4 flex flex-col items-center justify-center gap-4 text-slate-400 dark:text-slate-500 pb-8">
           <div className="flex gap-4">
              <a href="https://github.com/adiletbtrv" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-110 transition-all p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:shadow-md dark:shadow-none dark:hover:bg-slate-700">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="https://www.linkedin.com/in/adilet-batyrov/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 transition-all p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:shadow-md dark:shadow-none dark:hover:bg-slate-700">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
           </div>
           <p className="text-[10px] font-medium opacity-50">© 2025 Flux Financial.</p>
        </div>

      </div>
    </div>
  );
}

export default App;