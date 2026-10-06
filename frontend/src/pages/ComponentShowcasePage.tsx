import { IconPlus } from '@tabler/icons-react';
import { FeedbackExamples } from '@/features/componentShowcase/components/FeedbackExamples';
import { TableExample } from '@/features/componentShowcase/components/TableExample';
import { useState } from 'react';
import { ExampleForm } from '@/features/componentShowcase/components/ExampleForm';
import { Button } from '@/shared/components/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/card';

export function ComponentShowcasePage() {
  const [lastAction, setLastAction] = useState('Choose a button to try it.');

  return (
    <>
      <div className="flex max-w-2xl flex-col gap-4">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">The foundation</p>
        <h1 className="font-heading text-3xl leading-tight tracking-tight sm:text-5xl">A little room to explore.</h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          Shared components — a starting point for Edgar. Try the controls and switch themes to see how it feels.
        </p>
      </div>
      <div className="grid items-start gap-6 md:grid-cols-2">
        <ExampleForm />
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions, in every tone</CardTitle>
              <CardDescription>Consistent variants for everyday interactions.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={() => setLastAction('Primary action selected.')}>Primary</Button>
              <Button variant="secondary" onClick={() => setLastAction('Secondary action selected.')}>
                Secondary
              </Button>
              <Button variant="outline" onClick={() => setLastAction('Outline action selected.')}>
                Outline
              </Button>
              <Button variant="ghost" onClick={() => setLastAction('Ghost action selected.')}>
                Ghost
              </Button>
              <Button variant="destructive" onClick={() => setLastAction('Destructive style selected. No data was deleted.')}>
                Destructive
              </Button>
              <Button variant="text" onClick={() => setLastAction('Text action selected.')}>
                Text
              </Button>
              <Button size="sm" onClick={() => setLastAction('Small action selected.')}>
                Small
              </Button>
              <Button size="lg" onClick={() => setLastAction('Large action selected.')}>
                Large
              </Button>
              <Button size="icon" aria-label="Add preview" onClick={() => setLastAction('Add action selected.')}>
                <IconPlus />
              </Button>
              <Button disabled>Disabled</Button>
            </CardContent>
            <CardFooter>
              <p role="status" className="text-sm text-muted-foreground">
                {lastAction}
              </p>
            </CardFooter>
          </Card>
          <FeedbackExamples />
          <TableExample />
        </div>
      </div>
    </>
  );
}
