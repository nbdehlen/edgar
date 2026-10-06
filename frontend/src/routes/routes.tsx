import { Navigate, type RouteObject } from 'react-router';
import { AppLayout } from '@/shared/components/AppLayout';
import { SummaryPage } from '@/pages/SummaryPage';
import { FilingsPage } from '@/pages/FilingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/filings" replace /> },
      { path: 'filings', element: <FilingsPage /> },
      { path: 'summary', element: <SummaryPage /> },
      { path: 'companies/:ticker/filings', element: <FilingsPage /> },
      ...(import.meta.env.DEV
        ? [{ path: 'components', lazy: async () => ({ Component: (await import('@/pages/ComponentShowcasePage')).ComponentShowcasePage }) }]
        : []),
      { path: '*', element: <NotFoundPage /> }
    ]
  }
];
