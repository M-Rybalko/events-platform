import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { EventsListPage } from '@/pages/EventsListPage';
import { EventDetailsPage } from '@/pages/EventDetailsPage';
import { MapPage } from '@/pages/MapPage';
import { CreateEventPage } from '@/pages/CreateEventPage';
import { EditEventPage } from '@/pages/EditEventPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { OAuthCallbackPage } from '@/pages/auth/OAuthCallbackPage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },

      // Public
      { path: 'events', element: <EventsListPage /> },
      { path: 'events/:id', element: <EventDetailsPage /> },
      { path: 'map', element: <MapPage /> },

      // Auth
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'oauth/callback', element: <OAuthCallbackPage /> },

      // Protected — будь-який авторизований
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },

      // Protected — лише organizer/admin
      {
        path: 'create',
        element: (
          <ProtectedRoute roles={['organizer', 'admin']}>
            <CreateEventPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'events/:id/edit',
        element: (
          <ProtectedRoute roles={['organizer', 'admin']}>
            <EditEventPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute roles={['organizer', 'admin']}>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
