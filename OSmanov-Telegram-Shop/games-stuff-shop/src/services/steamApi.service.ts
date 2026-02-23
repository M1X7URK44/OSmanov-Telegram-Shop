export interface CurrencyRatesResponse {
  date: string;
  'rub/usd': string;
  'kzt/usd': string;
  'uah/usd': string;
}

class SteamApiService {
  async getCurrencyRates(): Promise<CurrencyRatesResponse> {
    try {
      const response = await fetch('/api/gifts/steam/currency-rates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to get currency rates');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching currency rates:', error);
      throw error;
    }
  }

  calculateAmountInCurrency(usdAmount: number, rate: string): number {
    const rateValue = parseFloat(rate);
    return usdAmount * rateValue;
  }
}

export const steamApiService = new SteamApiService();
