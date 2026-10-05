import { useNavigate, useParams, useSearchParams } from 'react-router';
import type { FilingsFilters } from '@/features/filings/api';

export function useFilingsLocation() {
  const { ticker = '' } = useParams();
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const requestedPage = Number(search.get('page') ?? 1);
  const filters: FilingsFilters = {
    form: search.get('form')?.trim() ?? '',
    sort: search.get('sort') === 'asc' ? 'asc' : 'desc',
    page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  };

  function updateFilters(changes: Partial<FilingsFilters>) {
    const next = { ...filters, page: 1, ...changes };
    const params = new URLSearchParams({ sort: next.sort, page: String(next.page) });
    if (next.form) params.set('form', next.form);
    setSearch(params);
  }

  function selectCompany(selectedTicker: string) {
    const params = new URLSearchParams({ sort: filters.sort, page: '1' });
    if (filters.form) params.set('form', filters.form);
    void navigate(`/companies/${encodeURIComponent(selectedTicker.trim().toUpperCase())}/filings?${params}`);
  }

  return { ticker: ticker.trim().toUpperCase(), filters, updateFilters, selectCompany };
}
