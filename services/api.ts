import axios from 'axios';
import { CurrencyMap, ExchangeRateResponse } from '../types';

const LIVE_URL = 'https://open.er-api.com/v6/latest';
const HISTORY_URL = 'https://api.frankfurter.app';

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'United States Dollar', EUR: 'Euro',
  GBP: 'British Pound Sterling', JPY: 'Japanese Yen',
  AUD: 'Australian Dollar', CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc', CNY: 'Chinese Yuan',
  HKD: 'Hong Kong Dollar', NZD: 'New Zealand Dollar',
  SEK: 'Swedish Krona', KRW: 'South Korean Won',
  SGD: 'Singapore Dollar', NOK: 'Norwegian Krone',
  MXN: 'Mexican Peso', INR: 'Indian Rupee',
  RUB: 'Russian Ruble', ZAR: 'South African Rand',
  TRY: 'Turkish Lira', BRL: 'Brazilian Real',
  TWD: 'New Taiwan Dollar', DKK: 'Danish Krone',
  PLN: 'Polish Zloty', THB: 'Thai Baht',
  IDR: 'Indonesian Rupiah', HUF: 'Hungarian Forint',
  CZK: 'Czech Koruna', ILS: 'Israeli New Shekel',
  CLP: 'Chilean Peso', PHP: 'Philippine Peso',
  AED: 'UAE Dirham', COP: 'Colombian Peso',
  SAR: 'Saudi Riyal', MYR: 'Malaysian Ringgit',
  RON: 'Romanian Leu', KZT: 'Kazakhstani Tenge',
  KGS: 'Kyrgyzstani Som', UZS: 'Uzbekistani Som',
  AMD: 'Armenian Dram', GEL: 'Georgian Lari',
  UAH: 'Ukrainian Hryvnia', AZN: 'Azerbaijani Manat',
  BYN: 'Belarusian Ruble',
};

const apiClient = axios.create({ timeout: 15000 });

export const fetchCurrencies = async (): Promise<CurrencyMap> => CURRENCY_NAMES;

export const fetchRates = async (baseCurrency: string): Promise<ExchangeRateResponse> => {
  const response = await apiClient.get(`${LIVE_URL}/${baseCurrency}`);
  return {
    amount: 1,
    base: response.data.base_code,
    date: response.data.time_last_update_utc ?? '',
    rates: response.data.rates,
  };
};

export const fetchHistory = async (
  from: string,
  to: string,
  days = 30,
): Promise<Record<string, Record<string, number>> | null> => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  try {
    const { data } = await axios.get(
      `${HISTORY_URL}/${fmt(start)}..${fmt(end)}?from=${from}&to=${to}`,
    );
    return data.rates ?? null;
  } catch {
    return null;
  }
};