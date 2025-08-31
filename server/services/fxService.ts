interface ExchangeRateApiResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

class FxService {
  private apiKey: string;
  private baseUrl = 'https://api.exchangerate-api.com/v4/latest';
  private cacheDuration = 15 * 60 * 1000; // 15 minutes in milliseconds

  constructor() {
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY || process.env.FX_API_KEY || 'demo_key';
  }

  async getCurrentRates(baseCurrency = 'USD'): Promise<Record<string, number>> {
    try {
      // Check if we have cached rates that are still valid
      const { storage } = await import('../storage');
      const cachedRates = await storage.getLatestFxRates();
      
      if (cachedRates && this.isCacheValid(cachedRates.lastUpdated)) {
        return cachedRates.rates as Record<string, number>;
      }

      // Fetch fresh rates from API
      const response = await fetch(`${this.baseUrl}/${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }

      const data: ExchangeRateApiResponse = await response.json();
      
      if (!data.success && data.rates) {
        throw new Error('Invalid response from exchange rate API');
      }

      const rates = data.rates || this.getFallbackRates();
      
      // Cache the new rates
      await storage.updateFxRates(rates);
      
      return rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      
      // Return cached rates if available, otherwise fallback rates
      const { storage } = await import('../storage');
      const cachedRates = await storage.getLatestFxRates();
      
      if (cachedRates) {
        return cachedRates.rates as Record<string, number>;
      }
      
      return this.getFallbackRates();
    }
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const rates = await this.getCurrentRates(fromCurrency);
    const rate = rates[toCurrency];
    
    if (!rate) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }
    
    return rate;
  }

  async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return Number((amount * rate).toFixed(2));
  }

  calculateFees(amount: number): { baseFee: number; exchangeFee: number; totalFee: number } {
    const baseFee = 4.99; // Fixed fee
    const exchangeFeePercent = 0.005; // 0.5%
    const exchangeFee = Number((amount * exchangeFeePercent).toFixed(2));
    const totalFee = Number((baseFee + exchangeFee).toFixed(2));
    
    return {
      baseFee,
      exchangeFee,
      totalFee,
    };
  }

  private isCacheValid(lastUpdated: Date): boolean {
    const now = new Date();
    const timeDiff = now.getTime() - lastUpdated.getTime();
    return timeDiff < this.cacheDuration;
  }

  private getFallbackRates(): Record<string, number> {
    // Fallback rates in case API is unavailable
    return {
      EUR: 0.8547,
      GBP: 0.7834,
      JPY: 149.25,
      KRW: 1325.00,
      CAD: 1.3500,
      AUD: 1.5234,
      CHF: 0.8923,
      CNY: 7.2456,
      INR: 83.1245,
      MXN: 17.8934,
    };
  }
}

export const fxService = new FxService();
