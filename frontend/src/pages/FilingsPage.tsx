import { useTranslation } from 'react-i18next';
import { FilingsError } from '@/features/filings/api';
import { useFilingsQuery } from '@/features/filings/queries';
import { useFilingsLocation } from '@/features/filings/hooks/useFilingsLocation';
import { CompanySwitcher } from '@/features/filings/components/CompanySwitcher';
import { FilingsFilters } from '@/features/filings/components/FilingsFilters';
import { FilingsResults } from '@/features/filings/components/FilingsResults';
import { Alert, AlertTitle, AlertDescription } from '@/shared/components/alert';
import { Button } from '@/shared/components/button';
import { DelayedLoading } from '@/shared/components/DelayedLoading';

export function FilingsPage() {
  const { t } = useTranslation();
  const { ticker, filters, selectCompany, updateFilters } = useFilingsLocation();
  const query = useFilingsQuery(ticker, filters);
  const unknownCompany = query.error instanceof FilingsError && query.error.status === 404;

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl">{t('filings.title')}</h1>
        <p className="text-muted-foreground">{t('filings.description')}</p>
      </div>
      <CompanySwitcher key={ticker} ticker={ticker} onSelect={selectCompany} />
      {ticker && (
        <>
          <FilingsFilters key={`${ticker}:${filters.form}`} filters={filters} onChange={updateFilters} />
          {query.isFetching && <DelayedLoading key={JSON.stringify([ticker, filters])} message={t('filings.loading', { ticker })} hasResults={!!query.data} />}
          {query.isError && (
            <Alert variant="destructive">
              <AlertTitle>{t(unknownCompany ? 'filings.unknownTitle' : 'filings.errorTitle')}</AlertTitle>
              <AlertDescription>
                <p>{t(unknownCompany ? 'filings.unknownDescription' : 'filings.errorDescription', { ticker })}</p>
                {!unknownCompany && (
                  <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
                    {t('filings.retry')}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          {query.isSuccess && <FilingsResults data={query.data} onPage={(page) => updateFilters({ page })} />}
        </>
      )}
    </div>
  );
}
