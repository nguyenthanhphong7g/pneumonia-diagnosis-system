import { Routes, Route } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useContext, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import SidebarPatient from './components/layout/SidebarPatient';
import SidebarDoctor from './components/layout/SidebarDoctor';
import SidebarAdmin from './components/layout/SidebarAdmin';
import Header from './components/layout/Header';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Home from './pages/Home';
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
        {/* Show sidebar only if user is logged in */}
        {user && SidebarComponent && sidebarOpen && (
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              width: '280px',
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
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/review" element={<DoctorReview />} />
            <Route path="/doctor-history" element={<DoctorHistory />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedAdminRoute>
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