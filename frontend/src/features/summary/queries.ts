import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchSummary } from './api';

export function useSummaryQuery(tickers: string[]) {
  return useQuery({
    queryKey: ['summary', tickers],
    queryFn: ({ signal }) => fetchSummary(tickers, signal),
    enabled: tickers.length > 0 && tickers.length <= 25,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: false
  });
}
