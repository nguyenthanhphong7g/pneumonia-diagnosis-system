import { Link, useLocation } from 'react-router-dom';
import {
  HomeOutlined as HomeIcon,
  HistoryOutlined as HistoryIcon,
  MedicalServicesOutlined as MedicalIcon,
  SettingsOutlined as SettingsIcon,
  AutoGraphOutlined as AnalysisIcon
} from '@mui/icons-material';
import { Box, List, ListItemIcon, ListItemText, ListItemButton, Typography, Chip } from '@mui/material';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

function Sidebar() {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const menuItems = [
    { path: '/', label: 'Chẩn đoán AI', icon: <HomeIcon />, badge: 'AI' },
    { path: '/history', label: 'Lịch sử quét', icon: <HistoryIcon />, protected: true },
    { path: '/review', label: 'Duyệt ca bệnh', icon: <MedicalIcon />, protected: true },
    { path: '/doctor-history', label: 'Lịch sử Review', icon: <AnalysisIcon />, protected: true },
  ];

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(226, 232, 240, 0.8)',
      }}
    >
      {/* Menu Section */}
      <List sx={{ flex: 1, px: 2, py: 4, overflow: 'auto' }}>
        <Typography
          sx={{
            fontSize: '0.65rem',
            fontWeight: 800,
            color: '#94a3b8',
            px: 2,
            mb: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}
        >
          Hệ thống chẩn đoán
        </Typography>

        {menuItems
          .filter(item => !item.protected || user)
          .map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: '12px',
                  mb: 1,
                  px: 2,
                  py: 1.5,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  
                  // Màu sắc và nền khi Active
                  color: isActive ? '#2563eb' : '#64748b',
                  bgcolor: isActive ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                  
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(37, 99, 235, 0.08)' : '#f8fafc',
                    color: '#2563eb',
                    transform: 'translateX(4px)',
                  },

                  // Thanh chỉ báo phía trước
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    height: '60%',
                    width: '4px',
                    borderRadius: '0 4px 4px 0',
                    bgcolor: '#2563eb',
                    transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                    transition: 'transform 0.2s ease',
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? '#2563eb' : '#94a3b8',
                    transition: '0.3s',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '0.9rem',
                    letterSpacing: '-0.01em',
                  }}
                />

                {/* Badge nhỏ cho phần Chẩn đoán */}
                {item.badge && isActive && (
                  <Chip 
                    label={item.badge} 
                    size="small" 
                    sx={{ 
                      height: 18, 
                      fontSize: '0.6rem', 
                      fontWeight: 900,
                      bgcolor: '#2563eb',
                      color: '#fff'
                    }} 
                  />
                )}
              </ListItemButton>
            );
          })}
      </List>

      {/* Tùy chọn Hệ thống (Phần dưới) */}
      <Box sx={{ px: 2, mb: 2 }}>
         <ListItemButton
            sx={{
                borderRadius: '12px',
                color: '#64748b',
                '&:hover': { bgcolor: '#f8fafc', color: '#2563eb' }
            }}
         >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Cài đặt" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
         </ListItemButton>
      </Box>

      {/* Version Footer */}
      <Box
        sx={{
          mx: 2,
          mb: 3,
          p: 2,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid #e2e8f0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box sx={{ width: 8, height: 8, bgcolor: '#22c55e', borderRadius: '50%' }} />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>
                Hệ thống Online
            </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
          Pneumonia AI System v1.0.0
        </Typography>
      </Box>
    </Box>
  );
}

export default Sidebar;