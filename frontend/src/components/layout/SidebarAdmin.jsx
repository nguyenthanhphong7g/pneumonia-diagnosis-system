import React from 'react';
import { Box, List, ListItemIcon, ListItemText, ListItemButton, Typography, Chip, alpha } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { 
  DashboardOutlined as DashboardIcon, 
  HomeOutlined as HomeIcon,
  AdminPanelSettingsOutlined as AdminIcon,
  StorageOutlined as DatabaseIcon,
  MemoryOutlined as ModelIcon
} from '@mui/icons-material';

const SidebarAdmin = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Quay lại Trang chủ', icon: <HomeIcon /> },
    { path: '/admin-dashboard', label: 'Model Dashboard', icon: <DashboardIcon />, badge: 'Core' },
    { path: '/system-logs', label: 'Logs Hệ thống', icon: <DatabaseIcon /> }, // Demo thêm cho đẹp
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
      {/* HEADER SECTION - ADMIN IDENTIFIER */}
      <Box sx={{ p: 3, pb: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5, 
          p: 1.5, 
          borderRadius: '16px', 
          bgcolor: alpha('#7c3aed', 0.05),
          border: `1px solid ${alpha('#7c3aed', 0.1)}`
        }}>
          <AdminIcon sx={{ color: '#7c3aed' }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Admin Control
          </Typography>
        </Box>
      </Box>

      {/* Menu Section */}
      <List sx={{ flex: 1, px: 2, py: 2, overflow: 'auto' }}>
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
          Quản lý tài nguyên
        </Typography>

        {menuItems.map((item) => {
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
                
                // Màu sắc Admin: Tím chủ đạo
                color: isActive ? '#7c3aed' : '#64748b',
                bgcolor: isActive ? alpha('#7c3aed', 0.04) : 'transparent',
                
                '&:hover': {
                  bgcolor: isActive ? alpha('#7c3aed', 0.08) : '#f8fafc',
                  color: '#7c3aed',
                  transform: 'translateX(6px)', // Nhích nhẹ sang phải
                },

                // Active Indicator (Dấu gạch dọc phía trước)
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '25%',
                  height: '50%',
                  width: '4px',
                  borderRadius: '0 4px 4px 0',
                  bgcolor: '#7c3aed',
                  transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                  transition: 'transform 0.2s ease',
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isActive ? '#7c3aed' : '#94a3b8',
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

              {item.badge && isActive && (
                <Chip 
                  label={item.badge} 
                  size="small" 
                  sx={{ 
                    height: 18, 
                    fontSize: '0.6rem', 
                    fontWeight: 900,
                    bgcolor: '#7c3aed',
                    color: '#fff',
                    borderRadius: '6px'
                  }} 
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      {/* MODEL STATUS CARD - Phần dành riêng cho Admin */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 20px -5px rgba(0,0,0,0.2)'
          }}
        >
          {/* Hình trang trí chìm */}
          <ModelIcon sx={{ position: 'absolute', right: -10, bottom: -10, fontSize: '4rem', opacity: 0.1, color: '#7c3aed' }} />
          
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', mb: 1, textTransform: 'uppercase' }}>
            Model Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, bgcolor: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e' }} />
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
              Active (VGG-16)
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.65rem', mt: 1, color: '#64748b' }}>
            Accuracy: 94.2% | Latency: 120ms
          </Typography>
        </Box>
      </Box>

      {/* Version Footer */}
      <Box sx={{ px: 3, py: 2, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.65rem', color: '#cbd5e1', fontWeight: 600 }}>
          ADMIN PANEL V1.0.0
        </Typography>
      </Box>
    </Box>
  );
};

export default SidebarAdmin;