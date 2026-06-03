import { Link, useLocation } from 'react-router-dom';
import {
  AddCircleOutlined as DiagnoseIcon, // Đã sửa tên icon
  HistoryOutlined as HistoryIcon,
  InfoOutlined as HelpIcon,
  FavoriteBorderOutlined as HealthIcon // Đã sửa tên icon
} from '@mui/icons-material';
import { Box, List, ListItemIcon, ListItemText, ListItemButton, Typography, alpha, Paper } from '@mui/material';

function SidebarPatient({ onItemClick }) {
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
      // Nền gradient xanh lá mint/pastel tươi sáng, tạo cảm giác an tâm, nhẹ nhàng
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      // Màu chữ xanh lá cây đậm (Forest Green), cực kỳ nổi bật và sắc nét
      color: '#14532d', 
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      // Đổ bóng soft-shadow tone xanh mint dịu nhẹ
      boxShadow: '0 8px 20px -6px rgba(22, 163, 74, 0.15)'
    }}
  >
    {/* Icon tự động nhận màu đậm từ Paper cha nhờ color: 'inherit' */}
    <HealthIcon sx={{ fontSize: '1.5rem', color: 'inherit' }} />
    <Box>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: 'inherit' }}>
        Sức khỏe của bạn
      </Typography>
      <Typography sx={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 600, color: 'inherit' }}>
        Cập nhật mỗi ngày
      </Typography>
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
              onClick={onItemClick}
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
                primary={
                  <Typography sx={{ fontWeight: isActive ? 700 : 600, fontSize: '0.9rem' }}>
                    {item.label}
                  </Typography>
                }
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* BOX TRỢ GIÚP */}

      {/* Footer */}
    </Box>
  );
}

export default SidebarPatient;