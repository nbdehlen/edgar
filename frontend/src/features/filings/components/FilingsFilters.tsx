import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Field, FieldGroup, FieldLabel } from '@/shared/components/field';
import { NativeSelect, NativeSelectOption } from '@/shared/components/native-select';
import type { FilingsFilters as Filters } from '@/features/filings/api';

const commonForms = ['10-K', '10-Q', '8-K'];

export function FilingsFilters({ filters, onChange }: { filters: Filters; onChange: (changes: Partial<Filters>) => void }) {
  const { t } = useTranslation();
  const isCustom = Boolean(filters.form && !commonForms.includes(filters.form));
  const [other, setOther] = useState(isCustom);
  const [draft, setDraft] = useState(isCustom ? filters.form : '');
  const selection = other ? 'other' : filters.form;

  return (
    <FieldGroup className="sm:flex-row sm:flex-wrap sm:items-end">
      <Field className="sm:w-48 sm:shrink-0">
        <FieldLabel htmlFor="form-type">{t('filings.formType')}</FieldLabel>
        <NativeSelect
          id="form-type"
          value={selection}
          onChange={(event) => {
            const value = event.target.value;
            setOther(value === 'other');
            if (value !== 'other') onChange({ form: value });
          }}
        >
          <NativeSelectOption value="">{t('filings.allForms')}</NativeSelectOption>
          {commonForms.map((form) => (
            <NativeSelectOption key={form} value={form}>
              {form}
            </NativeSelectOption>
          ))}
          <NativeSelectOption value="other">{t('filings.other')}</NativeSelectOption>
        </NativeSelect>
      </Field>
      {other && (
        <form
          className="w-full sm:w-80 sm:shrink-0"
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim()) onChange({ form: draft.trim().toUpperCase() });
          }}
        >
          <FieldGroup className="flex-row items-end">
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="exact-form" className="whitespace-nowrap">
                {t('filings.exactForm')}
              </FieldLabel>
              <Input id="exact-form" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="10-K/A" required />
            </Field>
            <Button type="submit" variant="outline" disabled={!draft.trim()}>
              {t('filings.apply')}
            </Button>
          </FieldGroup>
        </form>
      )}
      <Field className="sm:ml-auto sm:w-48 sm:shrink-0">
        <FieldLabel htmlFor="date-sort">{t('filings.sort')}</FieldLabel>
        <NativeSelect id="date-sort" value={filters.sort} onChange={(event) => onChange({ sort: event.target.value === 'asc' ? 'asc' : 'desc' })}>
          <NativeSelectOption value="desc">{t('filings.newest')}</NativeSelectOption>
          <NativeSelectOption value="asc">{t('filings.oldest')}</NativeSelectOption>
        </NativeSelect>
      </Field>
    </FieldGroup>
  );
}
