import { Button } from '@/shared/components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/table';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { CompanySummary } from '../api';
import { filingsLink, otherForms, totalFilings } from '../utils';

export function SummaryRow({ summary, forms }: { summary: CompanySummary; forms: string[] }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const others = otherForms(summary, forms);
  const count = others.reduce((total, [, amount]) => total + amount, 0);
  const total = totalFilings(summary);
  const { ticker, name } = summary.company;
  const Chevron = expanded ? IconChevronUp : IconChevronDown;

  return (
    <>
      <TableRow>
        <TableCell className="sticky left-0 bg-background">
          <Link to={filingsLink(ticker)} className="flex w-32 flex-col gap-1 sm:w-48 hover:underline">
            <span className="font-medium">{ticker}</span>
            <span className="truncate text-xs text-muted-foreground" title={name}>
              {name}
            </span>
          </Link>
        </TableCell>
        <TableCell className="text-right tabular-nums">{total}</TableCell>
        {forms.map((form) => (
          <TableCell key={form} className="text-right tabular-nums">
            {summary.filingsByForm[form] ?? 0}
          </TableCell>
        ))}
        <TableCell className="text-right tabular-nums">
          {count > 0 ? (
            <Button
              variant="text"
              size="sm"
              className="flex-row-reverse px-0 has-data-[icon=inline-end]:pr-0"
              aria-expanded={expanded}
              aria-controls={detailsId}
              aria-label={t('summary.otherLabel', { ticker, count })}
              onClick={() => setExpanded(!expanded)}
            >
              {count}
              <Chevron data-icon="inline-end" aria-hidden="true" />
            </Button>
          ) : (
            0
          )}
        </TableCell>
        <TableCell>
          {summary.latest10KDate ? (
            <time dateTime={summary.latest10KDate}>{summary.latest10KDate}</time>
          ) : (
            <span className="text-muted-foreground">{t('summary.noneFound')}</span>
          )}
        </TableCell>
      </TableRow>
      {expanded && count > 0 && (
        <TableRow id={detailsId} className="bg-muted/40">
          <TableCell colSpan={forms.length + 4} className="whitespace-normal">
            <div className="flex flex-col gap-3 py-2">
              <div className="max-w-xs">
                <Table aria-label={t('summary.otherTitle', { ticker })}>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{t('summary.otherForms')}</TableHead>
                      <TableHead scope="col" className="text-right">
                        {t('summary.filings')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {others.map(([form, amount]) => (
                      <TableRow key={form}>
                        <TableCell>{form}</TableCell>
                        <TableCell className="text-right tabular-nums">{amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
