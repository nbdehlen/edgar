import { SummaryError } from '@/features/summary/api';
import { SummaryCompanies } from '@/features/summary/components/SummaryCompanies';
import { DelayedLoading } from '@/shared/components/DelayedLoading';
import { SummaryResults } from '@/features/summary/components/SummaryResults';
import { useSummaryQuery } from '@/features/summary/queries';
import { parseSummaryTickers } from '@/features/summary/utils';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/alert';
import { Button } from '@/shared/components/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/shared/components/empty';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

export function SummaryPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useSearchParams();
  const tickers = parseSummaryTickers(search.get('tickers') ?? '');
  const query = useSummaryQuery(tickers);
  const unknown = query.error instanceof SummaryError && query.error.status === 404;
  const valid = tickers.length > 0 && tickers.length <= 25;

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl">{t('summary.title')}</h1>
        <p className="text-muted-foreground">{t('summary.description')}</p>
      </div>
      <SummaryCompanies
        tickers={tickers}
        onSelectionChange={(next) => {
          if (next.join(',') !== tickers.join(',')) setSearch(next.length ? { tickers: next.join(',') } : {});
        }}
      />
      {!tickers.length && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('summary.startTitle')}</EmptyTitle>
            <EmptyDescription>{t('summary.startDescription')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {valid && query.isFetching && <DelayedLoading message={t('summary.loading')} key={tickers.join(',')} hasResults={!!query.data} />}
      {valid && query.isError && (
        <Alert variant="destructive">
          <AlertTitle>{t('summary.errorTitle')}</AlertTitle>
          <AlertDescription>
            <p>{t(unknown ? 'summary.unknownDescription' : 'summary.errorDescription')}</p>
            <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
              {t('filings.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {valid && query.isSuccess && <SummaryResults data={query.data} />}
    </div>
  );
}
