import { Link, useLocation } from 'react-router-dom';
import {
  AddCircleOutlined as DiagnoseIcon, // Đã sửa tên icon
  HistoryOutlined as HistoryIcon,
  InfoOutlined as HelpIcon,
  FavoriteBorderOutlined as HealthIcon // Đã sửa tên icon
} from '@mui/icons-material';
import { Box, List, ListItemIcon, ListItemText, ListItemButton, Typography, alpha, Paper } from '@mui/material';

function SidebarPatient() {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Chẩn đoán mới', icon: <DiagnoseIcon /> },
    { path: '/history', label: 'Lịch sử khám', icon: <HistoryIcon /> },
  ];

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(226, 232, 240, 0.8)',
      }}
    >
      {/* SECTION CHÀO MỪNG */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.3)'
          }}
        >
          <HealthIcon sx={{ fontSize: '1.5rem' }} />
          <Box>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800 }}>Sức khỏe của bạn</Typography>
            <Typography sx={{ fontSize: '0.65rem', opacity: 0.9 }}>Cập nhật mỗi ngày</Typography>
          </Box>
        </Paper>
      </Box>

      {/* Danh sách Menu */}
      <List sx={{ flex: 1, px: 2, py: 1, overflow: 'auto' }}>
        <Typography
          sx={{
            fontSize: '0.65rem',
            fontWeight: 800,
            color: '#94a3b8',
            px: 2,
            mb: 2,
            mt: 1,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}
        >
          Dịch vụ của tôi
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
                py: 1.6,
                transition: 'all 0.3s ease',
                color: isActive ? '#059669' : '#64748b',
                bgcolor: isActive ? alpha('#10b981', 0.06) : 'transparent',
                '&:hover': {
                  bgcolor: isActive ? alpha('#10b981', 0.1) : '#f0fdf4',
                  color: '#059669',
                  transform: 'translateX(5px)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '25%',
                  height: '50%',
                  width: '4px',
                  borderRadius: '0 4px 4px 0',
                  bgcolor: '#059669',
                  transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                  transition: 'transform 0.2s ease',
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isActive ? '#059669' : '#94a3b8',
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
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* BOX TRỢ GIÚP */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: '16px',
            bgcolor: '#f8fafc',
            border: '1px dotted #e2e8f0',
            textAlign: 'center'
          }}
        >
          <HelpIcon sx={{ color: '#94a3b8', fontSize: '1.2rem', mb: 1 }} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
            Cần hỗ trợ?
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', mt: 0.5 }}>
            Liên hệ bác sĩ ngay nếu có thắc mắc.
          </Typography>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center', opacity: 0.5 }}>
        <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '1px' }}>
          PATIENT PORTAL V1.0.0
        </Typography>
      </Box>
    </Box>
  );
}

export default SidebarPatient;