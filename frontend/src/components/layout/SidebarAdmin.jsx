import React from 'react';
import { Box, List, ListItemIcon, ListItemText, ListItemButton, Typography, Chip, alpha } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined as DashboardIcon,
  HomeOutlined as HomeIcon,
  AdminPanelSettingsOutlined as AdminIcon,
  StorageOutlined as DatabaseIcon,
  MemoryOutlined as ModelIcon,
  PsychologyOutlined as DiagnosisIcon
} from '@mui/icons-material';

const SidebarAdmin = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin-home', label: 'Tổng quan', icon: <DashboardIcon /> },
    { path: '/ai-diagnosis', label: 'Chẩn đoán AI', icon: <DiagnosisIcon /> },
    { path: '/admin-dashboard', label: 'Bảng điều khiển', icon: <DashboardIcon />, badge: 'Core' },
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
      <Box sx={{ p: 3, pb: 2 }}>
  <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    gap: 0.5,
    p: 2,
    borderRadius: '20px',
    // Nền gradient tím pastel tươi sáng, nhẹ nhàng
    background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
    // Đổ bóng nhẹ dạng soft-shadow để ô nổi lên tinh tế
    boxShadow: '0 8px 20px -6px rgba(168, 85, 247, 0.2)',
    // Đổi toàn bộ chữ và icon bên trong thành màu tím đen đậm để không bị chìm
    color: '#3b0764' 
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {/* Icon thừa hưởng màu từ bố mẹ (color: 'inherit') để tự động ăn theo màu tím đen */}
      <AdminIcon sx={{ fontSize: '1.2rem', color: 'inherit' }} />
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'inherit' }}>
        Quản trị viên
      </Typography>
    </Box>
    <Typography sx={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 600, color: 'inherit' }}>
      Bảng điều khiển hệ thống
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
                primary={
                  <Typography sx={{ fontWeight: isActive ? 700 : 600, fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
                    {item.label}
                  </Typography>
                }
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

      {/* Version Footer */}
      
    </Box>
  );
};

export default SidebarAdmin;