import { Button } from '@/shared/components/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/shared/components/field';
import { NativeSelect, NativeSelectOption } from '@/shared/components/native-select';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from '@/shared/components/table';
import { IconArrowsSort, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SummaryResponse } from '../api';
import { defaultForms, sortSummaries } from '../utils';
import { SummaryRow } from './SummaryRow';

export function SummaryResults({ data }: { data: SummaryResponse }) {
  const { t } = useTranslation();
  const [forms, setForms] = useState(defaultForms);
  const [showColumns, setShowColumns] = useState(false);
  const [sort, setSort] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const availableForms = [...new Set([...defaultForms, ...forms, ...data.companies.flatMap((item) => Object.keys(item.filingsByForm))])].sort();
  const companies = sort ? sortSummaries(data.companies, sort.key, sort.direction, forms) : data.companies;
  const ColumnsChevron = showColumns ? IconChevronUp : IconChevronDown;
  const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const columns = [
    { key: 'company', label: t('summary.company') },
    { key: 'total', label: t('summary.total') },
    ...forms.map((form) => ({ key: form, label: form })),
    { key: 'other', label: t('summary.other') },
    { key: 'latest', label: t('summary.latest') }
  ];

  function sortBy(key: string) {
    const direction = sort?.key === key && sort.direction === 'ascending' ? 'descending' : 'ascending';
    setSort({ key, direction });
  }

  function updateForm(index: number, form: string) {
    setForms((current) => current.map((value, position) => (position === index ? form : value)).filter(Boolean));
    setSort(null);
  }

  return (
    <section className="flex min-w-0 flex-col gap-5" aria-label={t('summary.results')}>
      <div className="overflow-hidden rounded-xl border">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">{t('summary.activity')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('summary.period', {
                from: dateFormat.format(new Date(data.period.from)),
                to: dateFormat.format(new Date(data.period.to))
              })}
            </p>
          </div>
          <div className="flex gap-2">
            {sort && (
              <Button variant="ghost" size="sm" onClick={() => setSort(null)}>
                {t('summary.requestedOrder')}
              </Button>
            )}
            <Button variant="outline" size="sm" aria-expanded={showColumns} aria-controls="summary-columns" onClick={() => setShowColumns(!showColumns)}>
              {t('summary.columns')}
              <ColumnsChevron data-icon="inline-end" aria-hidden="true" />
            </Button>
          </div>
        </div>
        {showColumns && (
          <FieldGroup id="summary-columns" className="border-t bg-muted/40 p-4">
            <FieldDescription>{t('summary.columnHelp')}</FieldDescription>
            <div className="flex flex-wrap items-end gap-3">
              {forms.map((form, index) => (
                <Field key={index} className="w-auto">
                  <FieldLabel htmlFor={`summary-form-${index}`}>{t('summary.column', { number: index + 1 })}</FieldLabel>
                  <NativeSelect id={`summary-form-${index}`} value={form} onChange={(event) => updateForm(index, event.target.value)}>
                    <NativeSelectOption value="">{t('summary.removeColumn')}</NativeSelectOption>
                    {availableForms
                      .filter((option) => option === form || !forms.includes(option))
                      .map((option) => (
                        <NativeSelectOption key={option} value={option}>
                          {option}
                        </NativeSelectOption>
                      ))}
                  </NativeSelect>
                </Field>
              ))}
              {forms.length < 5 && availableForms.some((form) => !forms.includes(form)) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const next = availableForms.find((form) => !forms.includes(form));
                    if (next) setForms([...forms, next]);
                  }}
                >
                  {t('summary.addColumn')}
                </Button>
              )}
            </div>
          </FieldGroup>
        )}
      </div>
      <Table>
        <TableCaption>{t('summary.dateHelp')}</TableCaption>
        <TableHeader>
          <TableRow>
            {columns.map(({ key, label }) => (
              <TableHead
                key={key}
                aria-sort={sort?.key === key ? sort.direction : 'none'}
                className={key === 'company' ? 'sticky left-0 bg-background' : undefined}
              >
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => sortBy(key)}
                  className={
                    key === 'company' || key === 'latest'
                      ? 'w-full justify-start px-0 has-data-[icon=inline-end]:pr-0'
                      : 'w-full flex-row-reverse justify-start px-0 has-data-[icon=inline-end]:pr-0'
                  }
                >
                  {label}
                  <IconArrowsSort data-icon="inline-end" aria-hidden="true" />
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((summary) => (
            <SummaryRow key={summary.company.ticker} summary={summary} forms={forms} />
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
