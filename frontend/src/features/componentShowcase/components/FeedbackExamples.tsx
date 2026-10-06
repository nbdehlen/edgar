import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/alert';
import { Button } from '@/shared/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/card';
import { DelayedLoading } from '@/shared/components/DelayedLoading';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/shared/components/empty';
import { Separator } from '@/shared/components/separator';
import { Skeleton } from '@/shared/components/skeleton';

export function FeedbackExamples() {
  const [loading, setLoading] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback and loading</CardTitle>
        <CardDescription>Alerts, empty states, and loading placeholders.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Alert>
          <AlertTitle>Preview ready</AlertTitle>
          <AlertDescription>Your selected filings are ready to explore.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Unable to load filings</AlertTitle>
          <AlertDescription>Try again in a moment.</AlertDescription>
        </Alert>
        <Separator />
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No filings found</EmptyTitle>
            <EmptyDescription>Choose another form type to see results.</EmptyDescription>
          </EmptyHeader>
        </Empty>
        <Separator />
        <div aria-label="Skeleton preview" className="flex flex-col gap-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-full" />
        </div>
        <Button variant="outline" onClick={() => setLoading(!loading)}>
          {loading ? 'Stop loading preview' : 'Start loading preview'}
        </Button>
        {loading && <DelayedLoading message="Loading preview…" hasResults={false} />}
      </CardContent>
    </Card>
  );
}
