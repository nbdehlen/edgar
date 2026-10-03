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
          Buttons, inputs, and cards — a shared starting point for Edgar. Try the controls and switch themes to see how it feels.
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
              <Button disabled>Disabled</Button>
            </CardContent>
            <CardFooter>
              <p role="status" className="text-sm text-muted-foreground">
                {lastAction}
              </p>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Space to grow</CardTitle>
              <CardDescription>A reusable surface for the next idea.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This layout stacks on smaller screens and opens into two columns on desktop. Shared colors and spacing keep everything connected.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="link" asChild>
                <a href="#main">Back to top</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
