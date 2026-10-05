import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Field, FieldGroup, FieldLabel } from '@/shared/components/field';

export function CompanySwitcher({ ticker, onSelect }: { ticker: string; onSelect: (ticker: string) => void }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(ticker);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (draft.trim()) onSelect(draft);
      }}
    >
      <FieldGroup className="sm:flex-row sm:items-end">
        <Field className="sm:max-w-xs">
          <FieldLabel htmlFor="ticker">{t('filings.ticker')}</FieldLabel>
          <Input
            id="ticker"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('filings.tickerPlaceholder')}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            required
          />
        </Field>
        <Button type="submit" disabled={!draft.trim()}>
          {t('filings.show')}
        </Button>
      </FieldGroup>
    </form>
  );
}
