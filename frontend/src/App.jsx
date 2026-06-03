import { Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import SidebarPatient from './components/layout/SidebarPatient';
import SidebarDoctor from './components/layout/SidebarDoctor';
import SidebarAdmin from './components/layout/SidebarAdmin';
import Header from './components/layout/Header';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Home from './pages/Home';
import AdminHome from './pages/AdminHome';
import DoctorHome from './pages/DoctorHome';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorReview from './pages/DoctorReview';
import DoctorHistory from './pages/DoctorHistory';
import AdminDashboardAdvanced from './pages/AdminDashboardAdvanced';
import UserProfile from './pages/UserProfile';

function App() {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Choose sidebar based on user role
  let SidebarComponent = null;
  if (user?.role === 'DOCTOR') {
    SidebarComponent = SidebarDoctor;
  } else if (user?.role === 'ADMIN') {
    SidebarComponent = SidebarAdmin;
  } else if (user?.role === 'PATIENT') {
    SidebarComponent = SidebarPatient;
  } else if (user) {
    SidebarComponent = Sidebar;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      <Header onToggleSidebar={user ? () => setSidebarOpen(!sidebarOpen) : undefined} />

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, paddingTop: '64px' }}>
        {/* Mobile sidebar */}
        {user && SidebarComponent && isMobile && (
          <Drawer
            variant="temporary"
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            ModalProps={{ keepMounted: true }}
            PaperProps={{
              sx: {
                width: 'min(84vw, 320px)',
                backgroundColor: '#fff',
                top: '64px',
                height: 'calc(100% - 64px)',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
              },
            }}
          >
            <Box sx={{ width: '100%', height: '100%' }}>
              <SidebarComponent onItemClick={() => setSidebarOpen(false)} />
            </Box>
          </Drawer>
        )}

        {/* Desktop sidebar */}
        {user && SidebarComponent && !isMobile && sidebarOpen && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: { md: '240px', lg: '280px' },
              borderRight: '1px solid #e0e0e0',
              backgroundColor: '#ffffff',
              height: 'calc(100vh - 64px)',
              position: 'sticky',
              top: '64px',
              flexShrink: 0,
            }}
          >
            <SidebarComponent />
          </Box>
        )}

        <Box
          component="main"
          sx={{
            padding: { xs: 1.5, sm: 2, md: 2.5 },
            flex: 1,
            minWidth: 0,
            overflow: 'auto',
            backgroundColor: '#f5f7fa',
            maxWidth: '100%',
            width: '100%',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Routes>
            <Route
              path="/"
              element={
                user?.role === 'ADMIN'
                  ? <Navigate to="/admin-home" replace />
                  : user?.role === 'DOCTOR'
                    ? <DoctorHome />
                    : <Home />
              }
            />
            <Route
              path="/admin-home"
              element={
                <ProtectedAdminRoute allowedRoles={['ADMIN']}>
                  <AdminHome />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedAdminRoute allowedRoles={['PATIENT']}>
                  <History />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/review"
              element={
                <ProtectedAdminRoute allowedRoles={['DOCTOR']}>
                  <DoctorReview />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/ai-diagnosis"
              element={
                <ProtectedAdminRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                  <Home />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/doctor-history"
              element={
                <ProtectedAdminRoute allowedRoles={['DOCTOR']}>
                  <DoctorHistory />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedAdminRoute allowedRoles={['ADMIN', 'DOCTOR', 'PATIENT']}>
                  <UserProfile />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedAdminRoute allowedRoles={['ADMIN']}>
                  <AdminDashboardAdvanced />
                </ProtectedAdminRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

export default App;