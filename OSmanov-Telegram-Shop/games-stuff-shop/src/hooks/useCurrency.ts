import { useState, useEffect, useCallback } from 'react';
import { currencyService } from '../services/currencyService';

interface UseCurrencyReturn {
  convertToRub: (amount: number, fromCurrency: string) => Promise<number>;
  convertToUsd: (amount: number, fromCurrency: string) => Promise<number>;
  formatRubles: (amount: number) => string;
  formatDollars: (amount: number) => string;
  usdToRubRate: number | null;
  loading: boolean;
  error: string | null;
  refreshRates: () => Promise<void>;
  rateInfo: {
    rate: number;
    source: 'admin' | 'external' | 'fallback';
    updatedAt?: string;
  } | null;
}

export const useCurrency = (): UseCurrencyReturn => {
  const [usdToRubRate, setUsdToRubRate] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rateInfo, setRateInfo] = useState<UseCurrencyReturn['rateInfo']>(null);

  const loadExchangeRate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем курс и информацию о нем
      const rate = await currencyService.getUsdToRubRate();
      const info = await currencyService.getRateInfo();
      
      setUsdToRubRate(rate);
      setRateInfo(info);
      
      console.log('Exchange rate loaded:', { rate, source: info.source });
    } catch (err) {
      setError('Не удалось загрузить курс валют');
      console.error('Error loading exchange rate:', err);
      
      // Устанавливаем fallback значение
      setUsdToRubRate(90);
      setRateInfo({
        rate: 90,
        source: 'fallback'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExchangeRate();
    
    // Обновляем курс каждые 5 минут
    const interval = setInterval(loadExchangeRate, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
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

  const formatDollars = useCallback((amount: number): string => {
    return currencyService.formatDollars(amount);
  }, []);

  const refreshRates = useCallback(async (): Promise<void> => {
    await currencyService.refreshAdminRate();
    await loadExchangeRate();
  }, [loadExchangeRate]);

  return {
    convertToRub,
    convertToUsd,
    formatRubles,
    formatDollars,
    usdToRubRate,
    loading,
    error,
    refreshRates,
    rateInfo
  };
};