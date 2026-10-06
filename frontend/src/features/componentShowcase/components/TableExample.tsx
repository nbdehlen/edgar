import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/table';

export function TableExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tabular data</CardTitle>
        <CardDescription>A small sample of filing rows.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>Example filings for the component preview.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Form</TableHead>
              <TableHead>Filed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>AAPL</TableCell>
              <TableCell>10-K</TableCell>
              <TableCell>2025-10-31</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>MSFT</TableCell>
              <TableCell>10-Q</TableCell>
              <TableCell>2025-10-29</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
