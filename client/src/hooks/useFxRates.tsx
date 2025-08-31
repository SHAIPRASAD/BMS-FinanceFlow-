import { useQuery } from "@tanstack/react-query";

interface FxRatesResponse {
  rates: Record<string, number>;
  lastUpdated: string;
}

interface ConversionResponse {
  sourceAmount: number;
  sourceCurrency: string;
  targetAmount: number;
  targetCurrency: string;
  exchangeRate: number;
  fees: {
    baseFee: number;
    exchangeFee: number;
    totalFee: number;
  };
  totalCost: number;
}

export function useFxRates() {
  return useQuery<FxRatesResponse>({
    queryKey: ["/api/fx/rates"],
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });
}

export function useConversion(amount: string | number, fromCurrency: string, toCurrency: string) {
  return useQuery<ConversionResponse>({
    queryKey: ["/api/fx/convert", { amount, from: fromCurrency, to: toCurrency }],
    queryFn: async () => {
      const params = new URLSearchParams({
        amount: amount.toString(),
        from: fromCurrency,
        to: toCurrency,
      });
      
      const res = await fetch(`/api/fx/convert?${params}`);
      if (!res.ok) {
        throw new Error("Failed to convert currency");
      }
      return res.json();
    },
    enabled: !!amount && Number(amount) > 0 && fromCurrency !== toCurrency,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
