import { IconExternalLink } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { FilingsResponse } from '@/features/filings/api/filings';
import { Button } from '@/shared/components/button';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/shared/components/empty';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/shared/components/table';

export function FilingsResults({ data, onPage }: { data: FilingsResponse; onPage: (page: number) => void }) {
  const { t } = useTranslation();
  const { page, pageSize, total } = data.pagination;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="flex min-w-0 flex-col gap-5" aria-label={t('filings.results')}>
      <div>
        <h2 className="font-heading text-2xl break-words">{data.company.name}</h2>
        <p className="text-muted-foreground">{data.company.ticker}</p>
      </div>
      {data.filings.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('filings.emptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('filings.emptyDescription')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('filings.formType')}</TableHead>
              <TableHead>{t('filings.filingDate')}</TableHead>
              <TableHead>{t('filings.reportDate')}</TableHead>
              <TableHead>{t('filings.document')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.filings.map((filing) => (
              <TableRow key={filing.accessionNumber}>
                <TableCell>{filing.form}</TableCell>
                <TableCell>
                  <time dateTime={filing.filingDate}>{filing.filingDate}</time>
                </TableCell>
                <TableCell>{filing.reportDate ?? '—'}</TableCell>
                <TableCell>
                  {filing.documentUrl ? (
                    <Button asChild variant="link" size="sm" className="px-0">
                      <a
                        href={filing.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t('filings.documentLabel', { form: filing.form, date: filing.filingDate })}
                      >
                        {t('filings.viewDocument')}
                        <IconExternalLink data-icon="inline-end" aria-hidden="true" />
                      </a>
                    </Button>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <nav className="flex flex-wrap items-center justify-between gap-4" aria-label={t('filings.pagination')}>
        <p role="status" className="text-sm text-muted-foreground">
          {t('filings.pageStatus', { page, pages, total })}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => onPage(Math.min(page - 1, pages))}>
            {t('filings.previous')}
          </Button>
          <Button variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>
            {t('filings.next')}
          </Button>
        </div>
      </nav>
    </section>
  );
}
