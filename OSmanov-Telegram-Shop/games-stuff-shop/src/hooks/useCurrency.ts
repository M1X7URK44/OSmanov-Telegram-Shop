import { useState, useEffect, useCallback } from 'react';
import { currencyService } from '../services/currencyService';

interface UseCurrencyReturn {
  convertToRub: (amount: number, fromCurrency: string) => Promise<number>;
  convertToUsd: (amount: number, fromCurrency: string) => Promise<number>;
  formatRubles: (amount: number) => string;
  usdToRubRate: number | null;
  loading: boolean;
  error: string | null;
  refreshRates: () => Promise<void>;
}

export const useCurrency = (): UseCurrencyReturn => {
  const [usdToRubRate, setUsdToRubRate] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadExchangeRate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rate = await currencyService.getUsdToRubRate();
      setUsdToRubRate(rate);
    } catch (err) {
      setError('Не удалось загрузить курс валют');
      console.error('Error loading exchange rate:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExchangeRate();
  }, [loadExchangeRate]);

  const convertToRub = useCallback(async (amount: number, fromCurrency: string): Promise<number> => {
    return await currencyService.convertToRub(amount, fromCurrency);
  }, []);

  const convertToUsd = useCallback(async (amount: number, fromCurrency: string): Promise<number> => {
    return await currencyService.convertToUsd(amount, fromCurrency);
  }, []);

  const formatRubles = useCallback((amount: number): string => {
    return currencyService.formatRubles(amount);
  }, []);

  const refreshRates = useCallback(async (): Promise<void> => {
    await loadExchangeRate();
  }, [loadExchangeRate]);

  return {
    convertToRub,
    convertToUsd,
    formatRubles,
    usdToRubRate,
    loading,
    error,
    refreshRates
  };
};