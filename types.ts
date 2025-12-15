export interface CurrencyMap {
  [code: string]: string;
}

export interface Rates {
  [code: string]: number;
}

export interface ExchangeRateResponse {
  amount: number;
  base: string;
  date: string;
  rates: Rates;
}

export interface CurrencyOption {
  code: string;
  name: string;
}
