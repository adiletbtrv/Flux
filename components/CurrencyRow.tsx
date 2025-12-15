import React from 'react';
import { CurrencyOption } from '../types';
import CurrencySelect from './CurrencySelect';

interface CurrencyRowProps {
  label: string;
  amount: number | string;
  currency: string;
  currencies: CurrencyOption[];
  onAmountChange?: (amount: string) => void;
  onCurrencyChange: (currency: string) => void;
  readOnly?: boolean;
  loading?: boolean;
}

const FLAG_OVERRIDES: Record<string, string> = {
  EUR: 'eu', GBP: 'gb', USD: 'us', ANG: 'an', XCD: 'ag', XOF: 'sn', 
  XAF: 'cm', XPF: 'pf', AUD: 'au', NZD: 'nz', ZAR: 'za', ILS: 'il', 
  JPY: 'jp', KRW: 'kr', CHF: 'ch', CNY: 'cn', KGS: 'kg', KZT: 'kz', 
  UZS: 'uz', UAH: 'ua', RUB: 'ru', BYN: 'by', AMD: 'am', GEL: 'ge', 
  AZN: 'az', TRY: 'tr',
};

const CurrencyRow: React.FC<CurrencyRowProps> = ({
  label,
  amount,
  currency,
  currencies,
  onAmountChange,
  onCurrencyChange,
  readOnly = false,
  loading = false,
}) => {
  
  const getFlagUrl = (currencyCode: string) => {
    if (!currencyCode) return '';
    const code = currencyCode.toUpperCase();
    const countryCode = FLAG_OVERRIDES[code] || code.slice(0, 2).toLowerCase();
    return `https://flagcdn.com/w80/${countryCode}.png`;
  };

  return (
    <div className="group w-full">
      <div className="flex justify-between items-end mb-2 px-1">
        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider transition-colors group-hover:text-indigo-500 dark:group-hover:text-indigo-400">
          {label}
        </label>
      </div>
      
      <div className={`
        relative flex items-center w-full rounded-2xl border transition-all duration-300 ease-out
        ${!readOnly 
          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/30 focus-within:border-indigo-500' 
          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'
        }
      `}>
        <input
          type="number"
          className={`
            block w-full min-w-0 flex-1 bg-transparent border-none py-3 pl-4 pr-2
            text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-white
            placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-0 appearance-none
            transition-opacity duration-200
            ${loading ? 'opacity-50' : 'opacity-100'}
          `}
          placeholder="0"
          value={amount}
          onChange={(e) => onAmountChange && onAmountChange(e.target.value)}
          readOnly={readOnly}
          inputMode="decimal"
        />
        
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 sm:mx-2 flex-shrink-0"></div>

        <div className="pr-1 sm:pr-2 flex-shrink-0">
          <CurrencySelect 
            value={currency}
            options={currencies}
            onChange={onCurrencyChange}
            getFlagUrl={getFlagUrl}
          />
        </div>
      </div>
    </div>
  );
};

export default CurrencyRow;