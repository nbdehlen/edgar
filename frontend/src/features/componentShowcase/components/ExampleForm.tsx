import { useState, type FormEvent } from 'react';
import { Button } from '@/shared/components/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/shared/components/field';
import { Input } from '@/shared/components/input';

export function ExampleForm() {
  const [message, setMessage] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setMessage(`Preview saved for ${String(data.get('name')).trim()}.`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Make it yours</CardTitle>
        <CardDescription>A small form to try the inputs, focus states, and primary action.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Display name</FieldLabel>
              <Input id="name" name="name" placeholder="Alex Morgan" aria-describedby="name-description" autoComplete="name" required pattern=".*\S.*" />
              <FieldDescription id="name-description">Use any name to test this local preview.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" name="email" type="email" placeholder="alex@example.com" autoComplete="email" required />
            </Field>
            <Field data-disabled>
              <FieldLabel htmlFor="workspace">Workspace</FieldLabel>
              <Input id="workspace" value="Edgar demo" disabled />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center gap-3">
          <Button type="submit">Save preview</Button>
          <p role="status" className="text-sm text-muted-foreground">
            {message || 'Nothing is sent to a server.'}
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
