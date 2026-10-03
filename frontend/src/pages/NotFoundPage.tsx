import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/button';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="font-heading text-3xl">{t('notFound.title')}</h1>
      <p className="text-muted-foreground">{t('notFound.description')}</p>
      <Button asChild>
        <Link to="/components">View components</Link>
      </Button>
    </section>
  );
}
