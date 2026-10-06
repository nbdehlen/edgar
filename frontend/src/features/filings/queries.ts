import { useQuery } from '@tanstack/react-query';
import { fetchFilings, type FilingsFilters } from './api';

export function useFilingsQuery(ticker: string, filters: FilingsFilters) {
  return useQuery({
    queryKey: ['filings', ticker, filters],
    queryFn: ({ signal }) => fetchFilings(ticker, filters, signal),
    enabled: Boolean(ticker),
    placeholderData: (previousData, previousQuery) => (previousQuery?.queryKey[1] === ticker ? previousData : undefined),
    staleTime: 60_000,
    retry: false
  });
}
