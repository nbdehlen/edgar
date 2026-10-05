import { Navigate, type RouteObject } from 'react-router';
import { AppLayout } from '@/shared/components/AppLayout';
import { ComponentShowcasePage } from '@/pages/ComponentShowcasePage';
import { FilingsPage } from '@/pages/FilingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/filings" replace /> },
      { path: 'filings', element: <FilingsPage /> },
      { path: 'companies/:ticker/filings', element: <FilingsPage /> },
      { path: 'components', element: <ComponentShowcasePage /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  }
];
