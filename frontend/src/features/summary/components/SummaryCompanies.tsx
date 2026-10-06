import { Button } from '@/shared/components/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/components/field';
import { Input } from '@/shared/components/input';
import { IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseSummaryTickers } from '../utils';

export function SummaryCompanies({ tickers, onSelectionChange }: { tickers: string[]; onSelectionChange: (tickers: string[]) => void }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const additions = parseSummaryTickers(draft);
  const combined = [...new Set([...tickers, ...additions])];
  const oversized = combined.length > 25;
  const invalid = oversized || (submitted && additions.length === 0);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (!additions.length || oversized) return;
        setDraft('');
        setSubmitted(false);
        onSelectionChange(combined);
      }}
    >
      <FieldGroup>
        <Field data-invalid={invalid}>
          <div className="flex items-center justify-between gap-4">
            <FieldLabel htmlFor="summary-tickers">{t('summary.companies')}</FieldLabel>
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {combined.length} / 25
            </span>
          </div>
          {tickers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tickers.map((ticker) => (
                <Button
                  key={ticker}
                  type="button"
                  variant="secondary"
                  size="sm"
                  aria-label={t('summary.remove', { ticker })}
                  onClick={() => onSelectionChange(tickers.filter((item) => item !== ticker))}
                >
                  {ticker}
                  <IconX data-icon="inline-end" aria-hidden="true" />
                </Button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Input
              id="summary-tickers"
              className="min-w-40 flex-1"
              value={draft}
              placeholder={t('summary.placeholder')}
              aria-invalid={invalid}
              aria-describedby={invalid ? 'summary-ticker-error' : undefined}
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button type="submit">{t('summary.addCompanies')}</Button>
          </div>
          {invalid && <FieldError id="summary-ticker-error">{t(oversized ? 'summary.tickerError' : 'summary.emptyInput')}</FieldError>}
        </Field>
      </FieldGroup>
    </form>
  );
}
