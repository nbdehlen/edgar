import { useEffect, useState } from 'react';
import { Skeleton } from '@/shared/components/skeleton';

export function DelayedLoading({ message, hasResults }: { message: string; hasResults: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 300);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div role="status" className="flex flex-col gap-3">
      <p>{message}</p>
      {!hasResults && (
        <>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </>
      )}
    </div>
  );
}
