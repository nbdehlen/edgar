import { Navigate, type RouteObject } from 'react-router';
import { AppLayout } from '@/shared/components/AppLayout';
import { ComponentShowcasePage } from '@/pages/ComponentShowcasePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/components" replace /> },
      { path: 'components', element: <ComponentShowcasePage /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  }
];
