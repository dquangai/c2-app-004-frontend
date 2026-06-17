import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout/MainLayout';
import Home from '../pages/Home/Home';
import AiAssistant from '../pages/AiAssistant/AiAssistant';
import CommunityDirectory from '../pages/CommunityDirectory/CommunityDirectory';
import CommunityGroups from '../pages/CommunityGroups/CommunityGroups';
import SocialNetwork from '../pages/SocialNetwork/SocialNetwork';
import Messages from '../pages/Messages/Messages';
import ProfileSettings from '../pages/ProfileSettings/ProfileSettings';
import BookingHistory from '../pages/BookingHistory/BookingHistory';
import CalendarView from '../pages/CalendarView/CalendarView';
import ProfileDetail from '../pages/ProfileDetail/ProfileDetail';
import Authentication from '../pages/Authentication/Authentication';
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword';
import ResetPassword from '../pages/ResetPassword/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail/VerifyEmail';
import BecomeProvider from '../pages/BecomeProvider/BecomeProvider';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminOverview from '../pages/admin/AdminOverview';
import AdminMembers from '../pages/admin/AdminMembers';
import AdminApplications from '../pages/admin/AdminApplications';
import AdminProfileUpdates from '../pages/admin/AdminProfileUpdates';
import AdminSettings from '../pages/admin/AdminSettings';
import { AuthGuard, GuestGuard } from '../components/AuthGuard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/ai-assistant', element: <AiAssistant /> },
      { path: '/directory', element: <CommunityDirectory /> },
      { path: '/groups', element: <CommunityGroups /> },
      { path: '/social', element: <SocialNetwork /> },
      {
        path: '/chat',
        element: (
          <AuthGuard>
            <Messages />
          </AuthGuard>
        ),
      },
      {
        path: '/settings',
        element: (
          <AuthGuard>
            <ProfileSettings />
          </AuthGuard>
        ),
      },
      {
        path: '/become-provider',
        element: (
          <AuthGuard>
            <BecomeProvider />
          </AuthGuard>
        ),
      },
      {
        path: '/history',
        element: (
          <AuthGuard>
            <BookingHistory />
          </AuthGuard>
        ),
      },
      { path: '/calendar', element: <CalendarView /> },
      { path: '/profile/:id', element: <ProfileDetail /> },
    ],
  },
  {
    path: '/login',
    element: (
      <GuestGuard>
        <Authentication />
      </GuestGuard>
    ),
  },
  {
    path: '/signup',
    element: (
      <GuestGuard>
        <Authentication />
      </GuestGuard>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <GuestGuard>
        <ForgotPassword />
      </GuestGuard>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <GuestGuard>
        <ResetPassword />
      </GuestGuard>
    ),
  },
  {
    path: '/verify-email',
    element: <VerifyEmail />,
  },
  {
    path: '/verify-email-sent',
    element: <VerifyEmail />,
  },
  {
    path: '/admin',
    element: (
      <AuthGuard>
        <AdminLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="overview" replace /> },
      { path: 'overview', element: <AdminOverview /> },
      { path: 'members', element: <AdminMembers /> },
      { path: 'applications', element: <AdminApplications /> },
      { path: 'profile-updates', element: <AdminProfileUpdates /> },
      { path: 'settings', element: <AdminSettings /> },
    ],
  },
]);

export default router;
